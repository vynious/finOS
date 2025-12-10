use std::sync::Arc;

use axum::{
    middleware,
    routing::{get, put},
    Router,
};

use crate::{
    common::app_state::AppState,
    domain::{
        auth::handlers::authorization_middleware,
        receipt::handlers::{get_receipts_by_email, update_receipt_categories},
    },
};

pub fn routes(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/receipts/{email}", get(get_receipts_by_email))
        .route(
            "/receipts/{receipt_id}/categories",
            put(update_receipt_categories),
        )
        .route_layer(middleware::from_fn_with_state(
            state.clone(),
            authorization_middleware,
        ))
        .with_state(state)
}
