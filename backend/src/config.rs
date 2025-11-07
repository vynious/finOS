use std::env;

use anyhow::{Context, Result};

#[derive(Clone, Debug)]
pub struct AppConfig {
    pub mongo_uri: String,
    pub database: String,
    pub ollama_model: String,
    pub frontend_app_url: String,
    pub issuer_emails: Vec<String>,
}

impl AppConfig {
    pub fn from_env() -> Result<Self> {
        let mongo_uri =
            env::var("MONGO_URI").context("MONGO_URI must be set (Mongo connection string)")?;
        let database =
            env::var("DATABASE").context("DATABASE must be set (Mongo database name)")?;
        let ollama_model =
            env::var("OLLAMA_MODEL").context("OLLAMA_MODEL must be set (Model name)")?;
        let frontend_app_url =
            env::var("FRONTEND_APP_URL").context("FRONTEND_APP_URL must be set.")?;
        let raw_issuers = env::var("ISSUER_EMAILS")
            .context("ISSUER_EMAILS must be set (JSON array of strings)")?;
        let issuer_emails: Vec<String> = serde_json::from_str(&raw_issuers)
            .context("ISSUER_EMAILS must be a JSON array of strings")?;
        anyhow::ensure!(
            !issuer_emails.is_empty(),
            "ISSUER_EMAILS must contain at least one entry"
        );

        Ok(Self {
            mongo_uri,
            database,
            ollama_model,
            frontend_app_url,
            issuer_emails,
        })
    }
}
