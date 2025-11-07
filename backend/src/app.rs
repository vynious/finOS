use crate::{
    common::{app_state::AppState, db_conn::new_mongo_client},
    domain::{
        auth::{
            repository::{MongoTokenStore, TokenStore},
            routes::routes as auth_routes,
            service::AuthService,
        },
        email::service::EmailService,
        ingestor::service::IngestorService,
        receipt::service::ReceiptService,
        user::service::UserService,
    },
};
use anyhow::{Context, Result};
use axum::{routing::get, Router};
use backend::config::AppConfig;
use std::{env, sync::Arc, time::Duration};
use tokio::time::interval;
use tracing::error;

pub async fn build_app(config: AppConfig) -> Result<AppState> {
    let mongo_client = new_mongo_client(&config.mongo_uri, &config.database).await?;
    let token_store: Arc<dyn TokenStore> = Arc::new(MongoTokenStore::new(&mongo_client));
    let user_repo = crate::domain::user::repository::UserRepo::new(&mongo_client, &config.database);
    let receipt_repo =
        crate::domain::receipt::repository::ReceiptRepo::new(&mongo_client, &config.database);
    let email_repo =
        crate::domain::email::repository::EmailRepo::new(&mongo_client, &config.database);

    let user_svc = Arc::new(UserService::new(user_repo));
    let receipt_svc = Arc::new(ReceiptService::new(receipt_repo));
    let email_svc = Arc::new(EmailService::new(
        env::var("OLLAMA_MODEL").expect("Unspecified Ollama Model"),
        email_repo,
        token_store.clone(),
    ));
    let ingestor = Arc::new(IngestorService::new(
        email_svc.clone(),
        receipt_svc.clone(),
        user_svc.clone(),
        config.issuer_emails.clone(),
    ));
    let auth_svc = Arc::new(AuthService::new(token_store, config.frontend_app_url.clone()).await?);

    Ok(AppState::new(
        auth_svc,
        user_svc,
        receipt_svc,
        email_svc,
        ingestor,
    ))
}

pub fn mount_routes(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/", get(|| async { "Hello World" }))
        .merge(auth_routes(state))
}

pub fn start_sync_job(duration: u64, state: Arc<AppState>) {
    let _ = tokio::spawn(async move {
        let mut ticker = interval(Duration::from_secs(duration));
        loop {
            println!("starting countdown");
            ticker.tick().await;
            if let Err(e) = state.ingestor_service.sync_receipts().await {
                error!(error = %e, "ingestor failed");
                for cause in e.chain().skip(1) {
                    error!(%cause, "caused by");
                }
            }
        }
    });
}
