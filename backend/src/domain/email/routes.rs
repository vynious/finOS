use std::sync::Arc;

use axum::{middleware, routing::post, Router};

use crate::{
    common::app_state::AppState,
    domain::{auth::handlers::authorization_middleware, email::handlers::trigger_sync},
};

pub fn routes(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/sync", post(trigger_sync))
        .route_layer(middleware::from_fn_with_state(
            state.clone(),
            authorization_middleware,
        ))
        .with_state(state)
}
