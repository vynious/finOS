use std::{collections::{HashMap, HashSet}, env};
use anyhow::{Context, Error, Ok, Result};
use axum::{
    Router,
    routing::get
};
use dotenvy::dotenv;
mod service;
mod db;

#[tokio::main]
async fn main() {
    dotenv().ok();
    // let app = Router::new().route("/", get(|| async {"Hello World"}));
    // let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    // axum::serve(listener, app).await.unwrap();
    let email_svc = service::email_service::EmailService::new(env::var("OLLAMA_MODEL").expect("Unspecified Ollama Model"));
    let _ = email_svc.query_and_process_untracked(vec![
        "category:primary".to_string(), 
        "from:(noreply@wise.com OR from_us@trustbank.sg OR noreply@you.co)".to_string(), 
        "newer_than:7d".to_string()
    ]).await;


    println!("Hello, world!");
}
