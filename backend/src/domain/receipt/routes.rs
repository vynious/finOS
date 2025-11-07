use std::sync::Arc;

use axum::{middleware, routing::get, Router};

use crate::{
    common::app_state::AppState,
    domain::{auth::handlers::authorization_middleware, receipt::handlers::get_receipts_by_email},
};

pub fn routes(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/receipts/{email}", get(get_receipts_by_email))
        .route_layer(middleware::from_fn_with_state(
            state.clone(),
            authorization_middleware,
        ))
        .with_state(state)
}
