use crate::domain::auth::{
    models::{Claims, TokenRecord},
    repository::TokenStore,
};

use anyhow::{ensure, Context, Ok, Result};
use jsonwebtoken::{decode, encode, Header};
use jsonwebtoken::{DecodingKey, EncodingKey, Validation};
use oauth2::url::Url;
use oauth2::{
    basic::BasicClient, reqwest::async_http_client, AuthUrl, ClientId, ClientSecret, CsrfToken,
    PkceCodeChallenge, RedirectUrl, RefreshToken, Scope, TokenResponse, TokenUrl,
};
use serde::Deserialize;
use std::sync::Arc;
use time::{Duration as TimeDuration, OffsetDateTime};
use tokio::fs;

#[derive(Deserialize)]
pub struct ApplicationSecret {
    pub client_id: String,
    pub client_secret: String,
    pub token_uri: String,
    pub auth_uri: String,
    pub redirect_uris: Vec<String>,
}

#[derive(Clone)]
pub struct AuthService {
    token_store: Arc<dyn TokenStore>,
    pub oauth: BasicClient,
    jwt_encoding: EncodingKey,
    jwt_decoding: DecodingKey,
    jwt_validation: Validation,
}

impl AuthService {
    pub async fn new(token_store: Arc<dyn TokenStore>) -> Result<Self> {
        let secret_str = fs::read_to_string("client_secret_web.json")
            .await
            .context("Failed to read client secret file")?;

        let secret: ApplicationSecret =
            serde_json::from_str(&secret_str).context("Failed to parse client secret JSON")?;

        let redirect_uri = secret
            .redirect_uris
            .first()
            .context("No redirect URIs found in client secret")?;

        let oauth = BasicClient::new(
            ClientId::new(secret.client_id),
            Some(ClientSecret::new(secret.client_secret)),
            AuthUrl::new(secret.auth_uri).context("Invalid auth URI")?,
            Some(TokenUrl::new(secret.token_uri).context("Invalid token URI")?),
        )
        .set_redirect_uri(RedirectUrl::new(redirect_uri.clone()).context("Invalid redirect URI")?);

        let jwt_encoding = EncodingKey::from_secret("secret".as_ref());
        let jwt_decoding = DecodingKey::from_secret("secret".as_ref());
        let jwt_validation = Validation::default();

        Ok(Self {
            token_store,
            oauth,
            jwt_encoding,
            jwt_decoding,
            jwt_validation,
        })
    }

    pub fn auth_redirect(&self) -> (Url, CsrfToken, String) {
        let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();
        let (auth_url, csrf_token) = self
            .oauth
            .authorize_url(CsrfToken::new_random)
            .add_scope(Scope::new(
                "https://www.googleapis.com/auth/gmail.readonly".to_string(),
            ))
            .set_pkce_challenge(pkce_challenge.clone())
            .url();

        (auth_url, csrf_token, pkce_verifier.secret().to_string())
    }

    pub async fn get_token(&self, user_id: &str, provider: &str) -> Result<Option<TokenRecord>> {
        self.token_store
            .get(user_id, provider)
            .await
            .context("failed to fetch stored oauth token")
    }

    pub async fn store_token(&self, mut token: TokenRecord) -> Result<TokenRecord> {
        token.updated_at = OffsetDateTime::now_utc();

        if let Some(existing) = self
            .token_store
            .get(&token.user_id, &token.provider)
            .await
            .context("failed to load existing oauth token")?
        {
            if token.refresh_token.is_none() {
                // Preserve previously granted refresh tokens when Google omits them.
                token.refresh_token = existing.refresh_token;
            }
            self.token_store
                .update(token)
                .await
                .context("failed to update oauth token")
        } else {
            self.token_store
                .store(token)
                .await
                .context("failed to persist oauth token")
        }
    }

    pub async fn refresh_access_token(&self, user_id: &str, provider: &str) -> Result<TokenRecord> {
        let mut record = self
            .token_store
            .get(user_id, provider)
            .await
            .context("failed to fetch stored oauth token for refresh")?
            .context("no oauth token stored for user and provider")?;

        let refresh = record
            .refresh_token
            .clone()
            .context("stored oauth token is missing a refresh token")?;

        let refreshed = self
            .oauth
            .exchange_refresh_token(&RefreshToken::new(refresh))
            .request_async(async_http_client)
            .await
            .context("failed to refresh access token")?;

        record.access_token = refreshed.access_token().secret().to_string();
        record.expires_at = refreshed
            .expires_in()
            .map(|dur| OffsetDateTime::now_utc() + TimeDuration::seconds(dur.as_secs() as i64));
        if let Some(scope) = refreshed.scopes() {
            record.scope = scope
                .iter()
                .map(|s| s.as_ref())
                .collect::<Vec<_>>()
                .join(" ");
        }
        if let Some(refresh) = refreshed.refresh_token() {
            record.refresh_token = Some(refresh.secret().to_string());
        }
        record.updated_at = OffsetDateTime::now_utc();

        self.token_store
            .update(record.clone())
            .await
            .context("failed to persist refreshed oauth token")?;

        Ok(record)
    }

    pub fn issue_jwt(&self, token_record: &TokenRecord) -> Result<String> {
        let claims = Claims {
            sub: token_record.user_id.clone(),
            iat: OffsetDateTime::now_utc().unix_timestamp(),
            exp: (OffsetDateTime::now_utc() + TimeDuration::hours(1)).unix_timestamp(),
            iss: "finOS".to_string(),
            aud: "finOS".to_string(),
            roles: vec!["user".to_string()],
        };

        let jwt = encode(&Header::default(), &claims, &self.jwt_encoding)
            .context("failed to encode JWT")?;

        Ok(jwt)
    }

    pub fn decode_and_validate_expiry(&self, jwt: &str) -> Result<Claims> {
        let claims = decode::<Claims>(&jwt, &self.jwt_decoding, &self.jwt_validation)
            .context("failed to decode JWT")?
            .claims;
        let now = OffsetDateTime::now_utc().unix_timestamp();
        ensure!(claims.exp > now, "JWT expired");
        Ok(claims)
    }

    pub fn validate_roles(&self, claims: Claims, required_role: &str) -> Result<Claims> {
        let user_roles = &claims.roles;
        ensure!(
            user_roles.iter().all(|role| role == required_role),
            "missing role: {required_role}"
        );
        Ok(claims)
    }
}
