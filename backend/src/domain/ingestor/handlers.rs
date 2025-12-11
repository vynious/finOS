use std::sync::Arc;

use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use serde::Deserialize;

use crate::common::{api_response::ApiResponse, app_state::AppState};

#[derive(Deserialize)]
pub struct SyncRequest {
    email: String,
}

pub async fn trigger_sync(
    State(app): State<Arc<AppState>>,
    Json(request): Json<SyncRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    app.ingestor_service
        .sync_receipts(Some(request.email))
        .await
        .map_err(|err| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!(
                    "Failed to load sync receipts: {err}"
                ))),
            )
        })?;

    Ok(Json(ApiResponse::success(())))
}
