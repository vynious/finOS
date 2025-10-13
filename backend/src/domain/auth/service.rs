use crate::domain::auth::repository::{TokenRecord, TokenStore};
use anyhow::{Context, Result};
use oauth2::{basic::BasicClient, AuthUrl, ClientId, ClientSecret, RedirectUrl, TokenUrl};
use serde::Deserialize;
use std::sync::Arc;
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
}

impl AuthService {
    pub async fn new(token_store: Arc<dyn TokenStore>) -> Result<Self> {
        let secret_str = fs::read_to_string("client_secret_web.json")
            .await
            .context("Failed to read client secret file")?;
        
        let secret: ApplicationSecret = serde_json::from_str(&secret_str)
            .context("Failed to parse client secret JSON")?;
        
        let redirect_uri = secret.redirect_uris.first()
            .context("No redirect URIs found in client secret")?;
        
        let oauth = BasicClient::new(
            ClientId::new(secret.client_id),
            Some(ClientSecret::new(secret.client_secret)),
            AuthUrl::new(secret.auth_uri)
                .context("Invalid auth URI")?,
            Some(TokenUrl::new(secret.token_uri)
                .context("Invalid token URI")?),
        )
        .set_redirect_uri(RedirectUrl::new(redirect_uri.clone())
            .context("Invalid redirect URI")?);

        Ok(Self { token_store, oauth })
    }

    pub fn store_token(&self, token: TokenRecord) -> Result<()> {
        self.token_store.store(token);
        Ok(())
    }
}
