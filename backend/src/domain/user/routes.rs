use std::sync::Arc;

use axum::{middleware, routing::get, Router};

use crate::{
    common::app_state::AppState,
    domain::{auth::handlers::authorization_middleware, user::handlers::get_current_user},
};

pub fn routes(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/users/me", get(get_current_user))
        .route_layer(middleware::from_fn_with_state(
            state.clone(),
            authorization_middleware,
        ))
        .with_state(state)
}
