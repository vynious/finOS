use std::sync::Arc;

use axum::{routing::get, Router};

use crate::common::app_state::AppState;

use super::handlers::{google_login, google_oauth_callback};

pub fn routes(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/auth/google/login", get(google_login))
        .route("/auth/google/callback", get(google_oauth_callback))
        .with_state(state)
}
