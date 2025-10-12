use crate::common::app_state::AppState;
use crate::common::db_conn::new_mongo_client;
use crate::domain::{
    email::service::EmailService,
    ingestor::{self, service::IngestorService},
    receipt::service::ReceiptService,
    user::service::UserService,
};
use anyhow::Result;
use axum::Router;
use std::{env, sync::Arc};


pub async fn build_app() -> Result<AppState> {
    // Dependency Injection
    let mongo_client = new_mongo_client().await?;
    // Create repositories
    let user_repo = crate::domain::user::repository::UserRepo::new(&mongo_client);
    let receipt_repo = crate::domain::receipt::repository::ReceiptRepo::new(&mongo_client);
    let email_repo = crate::domain::email::repository::EmailRepo::new(&mongo_client);

    // Create services
    let user_svc = Arc::new(UserService::new(user_repo));
    let receipt_svc = Arc::new(ReceiptService::new(receipt_repo));
    let email_svc = Arc::new(EmailService::new(
        env::var("OLLAMA_MODEL").expect("Unspecified Ollama Model"),
        email_repo,
    ));
    let ingestor = IngestorService::new(email_svc.clone(), receipt_svc.clone(), user_svc.clone());

    Ok(AppState::new(
        user_svc.clone(),
        receipt_svc.clone(),
        email_svc.clone(),
        Arc::new(ingestor),
    ))
}

pub fn mount_routes(state: AppState) -> Router {
    let routes = Router::new();
    routes
}