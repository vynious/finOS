use crate::{
    db::{conn::new_mongo_client, email_repo::EmailRepo, receipt_repo::ReceiptRepo},
    service::{
        email_service::EmailService, ingestor_service::IngestorService,
        receipt_service::ReceiptService,
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

    let receipt_repo = ReceiptRepo::new(&mongo_client);
    let receipt_svc = ReceiptService::new(receipt_repo);
    let ingestor = Arc::new(IngestorService::new(email_svc, receipt_svc));

    // Async Runtime for Ingestion
    {
        tokio::spawn({
            let ingestor2 = Arc::clone(&ingestor);

            // TODO:
            // currently this runs for a single user (hardcoded),
            // make the ingestor run an async task for each user registered
            // and the query will be built based on the latest timestamp stored for each user.
            let queries = vec![
                "category:primary".to_string(),
                "from:(noreply@wise.com OR from_us@trustbank.sg OR noreply@you.co)".to_string(),
                "newer_than:7d".to_string(), // should change based on latest timestamp
            ];
            let target = "shawnthiah@gmail.com";

            async move {
                if let Err(e) = ingestor2.sync_receipts(&target, queries).await {
                    error!(error = %e, "ingestor failed");
                    for cause in e.chain().skip(1) {
                        error!(%cause, "caused by");
                    }
                }
            }
        })
    };

    // API Components
    let app = Router::new().route("/", get(|| async { "Hello World" }));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    println!("Done!");
    Ok(())
}
