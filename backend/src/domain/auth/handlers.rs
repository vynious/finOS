use anyhow::Context;
use axum::{
    body::Body,
    extract::{Query, Request, State},
    http::{self, Response, StatusCode},
    middleware::Next,
    response::{IntoResponse, Redirect},
};
use axum_extra::extract::cookie::{Cookie, CookieJar};
use cookie::SameSite;
use oauth2::{reqwest::async_http_client, AuthorizationCode, PkceCodeVerifier, TokenResponse};
use serde::Deserialize;
use std::sync::Arc;
use time::{Duration, OffsetDateTime};

use crate::{common::app_state::AppState, domain::auth::models::TokenRecord};

#[derive(Deserialize)]
pub struct OAuthCb {
    code: String,
    state: String,
}

#[derive(Deserialize)]
struct GoogleUserInfo {
    sub: String,
    email: String,
    name: Option<String>,
    #[serde(default)]
    email_verified: bool,
}

pub async fn google_login(
    State(app): State<Arc<AppState>>,
    jar: CookieJar,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let (auth_url, csrf_token, pkce_verifier) = app.auth_service.auth_redirect();

    let state_cookie = Cookie::build(("oauth_state", csrf_token.secret().to_string()))
        .path("/")
        .http_only(true)
        .build();
    let pkce_cookie = Cookie::build(("pkce_verifier", pkce_verifier))
        .path("/")
        .http_only(true)
        .build();

    let jar = jar.add(state_cookie).add(pkce_cookie);
    Ok((jar, Redirect::to(auth_url.as_ref())))
}

pub async fn google_oauth_callback(
    State(app): State<Arc<AppState>>,
    jar: CookieJar,
    Query(cb): Query<OAuthCb>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    async move {
        let state_cookie = jar
            .get("oauth_state")
            .context("missing oauth_state cookie")?;
        anyhow::ensure!(state_cookie.value() == cb.state, "state mismatch");

        let pkce_cookie = jar
            .get("pkce_verifier")
            .context("missing pkce_verifier cookie")?;
        let pkce = PkceCodeVerifier::new(pkce_cookie.value().to_string());

        let token = app
            .auth_service
            .oauth
            .exchange_code(AuthorizationCode::new(cb.code))
            .set_pkce_verifier(pkce)
            .request_async(async_http_client)
            .await
            .context("exchanging code for tokens")?;

        let access = token.access_token().secret().to_string();
        let refresh = token.refresh_token().map(|t| t.secret().to_string());
        let expires_at = token
            .expires_in()
            .map(|dur| OffsetDateTime::now_utc() + Duration::seconds(dur.as_secs() as i64));
        let scope = token.scopes().map(|scopes| {
            scopes
                .iter()
                .map(|s| s.as_ref())
                .collect::<Vec<_>>()
                .join(" ")
        });

        let profile: GoogleUserInfo = reqwest::Client::new()
            .get("https://openidconnect.googleapis.com/v1/userinfo")
            .bearer_auth(&access)
            .send()
            .await
            .context("requesting google userinfo")?
            .error_for_status()
            .context("google userinfo returned error status")?
            .json()
            .await
            .context("parsing google userinfo response")?;

        anyhow::ensure!(profile.email_verified, "google account email not verified");

        let user = app
            .user_service
            .ensure_google_user(
                &profile.email,
                &profile.sub,
                profile.name.as_deref(),
                &access,
            )
            .await?;

        let token_record = TokenRecord {
            user_id: user.email.clone(),
            account_sub: Some(profile.sub.clone()),
            account_email: profile.email.clone(),
            account_name: profile.name.clone(),
            provider: "google".to_string(),
            scope: scope.unwrap_or_else(|| "https://www.googleapis.com/auth/gmail.readonly".into()),
            access_token: access,
            refresh_token: refresh,
            expires_at: expires_at,
            updated_at: OffsetDateTime::now_utc(),
        };

        let final_state_token = app.auth_service.store_token(token_record).await?;

        let jwt = app
            .auth_service
            .issue_jwt(&final_state_token)
            .context("issuing app session jwt")?;

        let session_cookie = Cookie::build(("session", jwt))
            .http_only(true)
            .secure(true) // set true in HTTPS; false only for local http dev
            .same_site(SameSite::Lax) // or Strict; use None for cross-site iframes + Secure
            .path("/")
            .max_age(Duration::minutes(30))
            .build();

        let stale = OffsetDateTime::now_utc() - Duration::days(1);
        let jar = jar
            .remove(
                Cookie::build(("oauth_state", ""))
                    .path("/")
                    .expires(stale)
                    .build(),
            )
            .remove(
                Cookie::build(("pkce_verifier", ""))
                    .path("/")
                    .expires(stale)
                    .build(),
            )
            .add(session_cookie);

        Ok::<_, anyhow::Error>((jar, Redirect::to(&app.auth_service.frontend_url)))
    }
    .await
    .map_err(|err| (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()))
}

pub async fn authorization_middleware(
    State(app): State<Arc<AppState>>,
    req: Request,
    next: Next,
) -> Result<Response<Body>, (StatusCode, String)> {
    // parse out the authorization token
    let token = req
        .headers()
        .get(http::header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|v| {
            let mut it = v.split_whitespace();
            match (it.next(), it.next()) {
                (Some(scheme), Some(tok)) if scheme.eq_ignore_ascii_case("bearer") => Some(tok),
                _ => None,
            }
        })
        .ok_or((
            StatusCode::UNAUTHORIZED,
            "Missing or malformed Authorization header".to_string(),
        ))?;

    let _ = app
        .auth_service
        .decode_and_validate_expiry(token)
        .and_then(|c| app.auth_service.validate_roles(c, "user"))
        .map_err(|e| (StatusCode::UNAUTHORIZED, format!("Invalid token: {e}")))?;

    Ok(next.run(req).await)
}
