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
use anyhow::Result;
use axum::{routing::get, Router};
use std::{env, sync::Arc};

pub async fn build_app() -> Result<AppState> {
    let mongo_client = new_mongo_client().await?;

    let user_repo = crate::domain::user::repository::UserRepo::new(&mongo_client);
    let receipt_repo = crate::domain::receipt::repository::ReceiptRepo::new(&mongo_client);
    let email_repo = crate::domain::email::repository::EmailRepo::new(&mongo_client);

    let user_svc = Arc::new(UserService::new(user_repo));
    let receipt_svc = Arc::new(ReceiptService::new(receipt_repo));
    let email_svc = Arc::new(EmailService::new(
        env::var("OLLAMA_MODEL").expect("Unspecified Ollama Model"),
        email_repo,
    ));
    let ingestor = Arc::new(IngestorService::new(
        email_svc.clone(),
        receipt_svc.clone(),
        user_svc.clone(),
    ));

    let token_store: Arc<dyn TokenStore> = Arc::new(MongoTokenStore::new(&mongo_client));
    let auth_svc = Arc::new(AuthService::new(token_store).await?);

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
