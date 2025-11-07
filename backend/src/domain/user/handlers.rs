use std::sync::Arc;

use axum::{extract::State, http::StatusCode, response::IntoResponse, Extension, Json};

use crate::{
    common::{api_response::ApiResponse, app_state::AppState},
    domain::{auth::models::Claims, user::models::PublicUser},
};

pub async fn get_current_user(
    Extension(claims): Extension<Claims>,
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    let user = state
        .user_service
        .find_by_email(&claims.sub)
        .await
        .map_err(|err| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!(
                    "Failed to load user profile: {err}"
                ))),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::NOT_FOUND,
                Json(ApiResponse::error("User not found".into())),
            )
        })?;

    Ok(Json(ApiResponse::success(PublicUser::from(user))))
}
