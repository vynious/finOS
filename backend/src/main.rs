use crate::{
    db::{
        conn::new_mongo_client,
        email_repo::EmailRepo,
        receipt_repo::{self, ReceiptRepo},
    },
    service::{
        email_service::EmailService, ingestor_service::IngestorService,
        receipt_service::ReceiptService,
    },
};
use anyhow::{Context, Error, Ok, Result};
use axum::{routing::get, Router};
use dotenvy::dotenv;
use std::{
    collections::{HashMap, HashSet},
    env,
};
use tracing::{error, info};
mod db;
mod service;

#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();
    // let app = Router::new().route("/", get(|| async {"Hello World"}));
    // let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    // axum::serve(listener, app).await.unwrap();

    // Dependency Injection
    let mongo_client = new_mongo_client().await?;
    let email_repo = EmailRepo::new(&mongo_client);
    let email_svc = EmailService::new(
        env::var("OLLAMA_MODEL").expect("Unspecified Ollama Model"),
        email_repo,
    );

    let receipt_repo = ReceiptRepo::new(&mongo_client);
    let receipt_svc = ReceiptService::new(receipt_repo);
    let ingestor = IngestorService::new(email_svc, receipt_svc);

    let queries = vec![
        "category:primary".to_string(),
        "from:(noreply@wise.com OR from_us@trustbank.sg OR noreply@you.co)".to_string(),
        "newer_than:7d".to_string(), // Query should change based on latest timestamp
    ];
    let target = "shawnthiah@gmail.com";

    // temp logging
    if let Err(e) = ingestor.sync_receipts(target, queries).await {
        error!(error = %e, "fatal");
        for cause in e.chain().skip(1) {
            error!(%cause, "caused by");
        }
        std::process::exit(1);
    }
    println!("Done!");
    Ok(())
}
