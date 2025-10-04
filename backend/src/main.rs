use crate::{
    db::{
        conn::new_mongo_client, email_repo::EmailRepo, receipt_repo::ReceiptRepo,
        user_repo::UserRepo,
    },
    service::{
        email_service::EmailService, ingestor_service::IngestorService,
        receipt_service::ReceiptService, user_service::UserService,
    },
};
use anyhow::Result;
use axum::{routing::get, Router};
use dotenvy::dotenv;
use std::{env, sync::Arc};
use tracing::error;
mod db;
mod service;

#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();

    // Dependency Injection
    let mongo_client = new_mongo_client().await?;
    let email_repo = EmailRepo::new(&mongo_client);
    let email_svc = EmailService::new(
        env::var("OLLAMA_MODEL").expect("Unspecified Ollama Model"),
        email_repo,
    );
    let user_repo = UserRepo::new(&mongo_client);
    let user_svc = UserService::new(user_repo);

    let receipt_repo = ReceiptRepo::new(&mongo_client);
    let receipt_svc = ReceiptService::new(receipt_repo);
    let ingestor = IngestorService::new(email_svc, receipt_svc, user_svc);

    // cron job once every day?
    if let Err(e) = ingestor.sync_receipts().await {
        error!(error = %e, "ingestor failed");
        for cause in e.chain().skip(1) {
            error!(%cause, "caused by");
        }
    }

    // API Components
    let app = Router::new().route("/", get(|| async { "Hello World" }));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    println!("Done!");
    Ok(())
}
