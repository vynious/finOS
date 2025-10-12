use crate::{
    common::{
        db_conn::new_mongo_client,
        app_state::AppState,
    },
    domain::{
        email::service::EmailService,
        ingestor::service::IngestorService,
        receipt::service::ReceiptService,
        user::service::UserService,
    },
};
use anyhow::Result;
use axum::{routing::get, Router};
use dotenvy::dotenv;
use std::{env, sync::Arc};
use tracing::error;
mod common;
mod domain;

#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();

    // Dependency Injection
    let mongo_client = new_mongo_client().await?;
    
    // Create repositories
    let user_repo = crate::domain::user::repository::UserRepo::new(&mongo_client);
    let receipt_repo = crate::domain::receipt::repository::ReceiptRepo::new(&mongo_client);
    let email_repo = crate::domain::email::repository::EmailRepo::new(&mongo_client);
    
    // Create services
    let user_svc = UserService::new(user_repo);
    let receipt_svc = ReceiptService::new(receipt_repo);
    let email_svc = EmailService::new(
        env::var("OLLAMA_MODEL").expect("Unspecified Ollama Model"),
        email_repo,
    );
    let ingestor = IngestorService::new(email_svc.clone(), receipt_svc.clone(), user_svc.clone());
    let app_state = AppState::new(user_svc, receipt_svc, email_svc);

    // cron job once every day?
    if let Err(e) = ingestor.sync_receipts().await {
        error!(error = %e, "ingestor failed");
        for cause in e.chain().skip(1) {
            error!(%cause, "caused by");
        }
    }

    // API Components
    let app = Router::new().route("/", get(|| async { "Hello World" }));

    // Start the server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    println!("Done!");
    Ok(())
}
