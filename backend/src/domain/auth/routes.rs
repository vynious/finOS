use std::sync::Arc;

use axum::{
    routing::{get, post},
    Router,
};

use crate::{common::app_state::AppState, domain::auth::handlers::logout};

use super::handlers::{google_login, google_oauth_callback};

pub fn routes(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/auth/google/login", get(google_login))
        .route("/auth/google/callback", get(google_oauth_callback))
        .route("/auth/logout", post(logout))
        .with_state(state)
}
