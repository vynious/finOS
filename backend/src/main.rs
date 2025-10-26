use anyhow::{Context, Result};
use dotenvy::dotenv;
use std::sync::Arc;
use tracing::error;

use crate::app::{build_app, mount_routes};
mod app;
mod common;
mod domain;

#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();

    let app_state = Arc::new(build_app().await.context("Building App")?);

    // cron job once every day?
    if let Err(e) = app_state.ingestor_service.sync_receipts().await {
        error!(error = %e, "ingestor failed");
        for cause in e.chain().skip(1) {
            error!(%cause, "caused by");
        }
    }

    // API Components
    let app = mount_routes(app_state);

    // Start the server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    println!("Done!");
    Ok(())
}
