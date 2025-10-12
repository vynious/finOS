use axum::{routing::get, Router};

use crate::{common::app_state::AppState, domain::receipt::handler::get_receipts_by_email};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/receipts/:email", get(get_receipts_by_email))
}
