use crate::app::{build_app, mount_routes, start_sync_job};
use anyhow::{Context, Result};
use backend::config::AppConfig;
use dotenvy::dotenv;
use std::sync::Arc;
mod app;
mod common;
mod domain;

#[tokio::main]
async fn main() -> Result<()> {
    dotenv().ok();
    let config = AppConfig::from_env()?;
    let app_state = Arc::new(build_app(config).await.context("Building App")?);

    // API Components
    let app = mount_routes(app_state.clone());
    start_sync_job(60, app_state.clone());

    // Start the server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:4000").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    println!("Done!");
    Ok(())
}
