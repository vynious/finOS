use std::{collections::{HashMap, HashSet}, f32::consts::E};
use anyhow::{Context, Error, Ok, Result};
use axum::{
    Router,
    routing::get
};
pub mod email_parser;
pub mod db;
use crate::email_parser::EmailService;


#[tokio::main]
async fn main() {

    // let app = Router::new().route("/", get(|| async {"Hello World"}));
    // let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    // axum::serve(listener, app).await.unwrap();
    let email_svc = EmailService::new();
    let _ = email_svc.query_and_process_unseen(vec!["".to_string()]).await;

    println!("Hello, world!");
}
