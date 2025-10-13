use anyhow::{Context, Result};
use axum::{
    extract::{Query, State},
    response::{IntoResponse, Redirect},
};
use axum_extra::extract::cookie::CookieJar;
use oauth2::reqwest::async_http_client;
use oauth2::{AuthorizationCode, PkceCodeVerifier};
use serde::Deserialize;
use std::sync::Arc;
use time::OffsetDateTime;

use crate::{common::app_state::AppState, domain::auth::repository::TokenRecord};

#[derive(Deserialize)]
struct OAuthCb {
    code: String,
    state: String,
}

async fn google_oauth_callback(
    State(app): State<Arc<AppState>>,
    jar: CookieJar,
    Query(cb): Query<OAuthCb>,
) -> Result<impl IntoResponse> {
    // Validate state
    let state_cookie = jar
        .get("oauth_state")
        .context("missing oauth_state cookie")?;
    anyhow::ensure!(state_cookie.value() == cb.state, "state mismatch");

    // Retrieve PKCE verifier
    let pkce_cookie = jar
        .get("pkce_verifier")
        .context("missing pkce_verifier cookie")?;
    let pkce = PkceCodeVerifier::new(pkce_cookie.value().to_string());

    // Exchange code for tokens
    let token = app
        .auth_service
        .oauth
        .exchange_code(AuthorizationCode::new(cb.code))
        .set_pkce_verifier(pkce)
        .request_async(async_http_client)
        .await
        .context("exchanging code for tokens")?;

    // Parse essentials
    let access = token.access_token().secret().to_string();
    let refresh = token.refresh_token().map(|t| t.secret().to_string());
    let expires_at = token
        .expires_in()
        .map(|dur| OffsetDateTime::now_utc() + time::Duration::seconds(dur.as_secs() as i64));

    // Associate with your app user (replace with your session user_id)
    let user_id = "current-user-id"; // e.g., from your auth session/cookie

    app.auth_service.store_token(TokenRecord {
            user_id: user_id.to_string(),
            provider: "google".to_string(),
            scope: "gmail.readonly".to_string(),
            access_token: access,
            refresh_token: refresh,
            expires_at,
            updated_at: OffsetDateTime::now_utc(),
        });


    // Clear transient cookies
    let jar = jar.remove("oauth_state").remove("pkce_verifier");

    Ok((jar, Redirect::to("/app")))
}
