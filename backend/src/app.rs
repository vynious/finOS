use crate::{
    common::{app_state::AppState, db_conn::new_mongo_client},
    domain::{
        auth::{
            repository::{MongoTokenStore, TokenStore},
            routes::routes as auth_routes,
            service::AuthService,
        },
        email::{routes::routes as email_routes, service::EmailService},
        ingestor::service::IngestorService,
        receipt::{routes::routes as receipt_routes, service::ReceiptService},
        user::{routes::routes as user_routes, service::UserService},
    },
};
use anyhow::Result;
use axum::{
    http::{self, HeaderValue},
    routing::get,
    Router,
};
use backend::config::AppConfig;
use reqwest::Method;
use std::{env, sync::Arc, time::Duration};
use tokio::time::interval;
use tower_http::{
    cors::{AllowHeaders, CorsLayer},
    trace::TraceLayer,
};
use tracing::error;

pub async fn build_app(config: AppConfig) -> Result<AppState> {
    let mongo_client = new_mongo_client(&config.mongo_uri, &config.database).await?;
    let token_store: Arc<dyn TokenStore> =
        Arc::new(MongoTokenStore::new(&mongo_client, &config.database));
    let user_repo = crate::domain::user::repository::UserRepo::new(&mongo_client, &config.database);
    let receipt_repo =
        crate::domain::receipt::repository::ReceiptRepo::new(&mongo_client, &config.database);
    let email_repo =
        crate::domain::email::repository::EmailRepo::new(&mongo_client, &config.database);
    let auth_svc = Arc::new(AuthService::new(token_store, config.frontend_app_url.clone()).await?);
    let user_svc = Arc::new(UserService::new(user_repo));
    let receipt_svc = Arc::new(ReceiptService::new(receipt_repo));
    let email_svc = Arc::new(EmailService::new(
        env::var("OLLAMA_MODEL").expect("Unspecified Ollama Model"),
        email_repo,
        auth_svc.clone(),
    ));
    let ingestor = Arc::new(IngestorService::new(
        email_svc.clone(),
        receipt_svc.clone(),
        user_svc.clone(),
        config.issuer_emails.clone(),
    ));

    Ok(AppState::new(
        auth_svc,
        user_svc,
        receipt_svc,
        email_svc,
        ingestor,
    ))
}

pub fn mount_routes(state: Arc<AppState>) -> Router {
    let base_state = state.clone();
    let auth_state = state.clone();
    let receipt_state = state.clone();
    let email_state = state.clone();
    let user_state = state;
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::OPTIONS])
        .allow_origin(
            std::env::var("FRONTEND_APP_URL")
                .expect("FRONTEND_APP_URL needs to be set!")
                .parse::<HeaderValue>()
                .expect("valid FRONTEND_APP_URL"),
        )
        .allow_headers(AllowHeaders::list([
            http::header::ACCEPT,
            http::header::CONTENT_TYPE,
            http::header::AUTHORIZATION,
        ]))
        .allow_credentials(true)
        .max_age(Duration::from_secs(60 * 60));

    Router::new()
        .route("/", get(|| async { "Hello World" }))
        .with_state(base_state)
        .merge(auth_routes(auth_state))
        .merge(receipt_routes(receipt_state))
        .merge(email_routes(email_state))
        .merge(user_routes(user_state))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
}

pub fn start_sync_job(duration: u64, state: Arc<AppState>) {
    let _ = tokio::spawn(async move {
        let mut ticker = interval(Duration::from_secs(duration));
        loop {
            println!("starting countdown");
            ticker.tick().await;
            if let Err(e) = state.ingestor_service.sync_receipts().await {
                error!(error = %e, "ingestor failed");
                for cause in e.chain().skip(1) {
                    error!(%cause, "caused by");
                }
            }
        }
    });
}
