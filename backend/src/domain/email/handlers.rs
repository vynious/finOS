use std::sync::Arc;

use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use serde::Deserialize;

use crate::{
    common::{api_response::ApiResponse, app_state::AppState},
    domain::receipt::models::ReceiptList,
};

#[derive(Deserialize)]
pub struct SyncRequest {
    email: String,
    last_synced: Option<i64>,
}

pub async fn trigger_sync(
    State(app): State<Arc<AppState>>,
    Json(request): Json<SyncRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<ReceiptList>>)> {
    let current_time = chrono::Utc::now().timestamp();
    let queries = app
        .ingestor_service
        .build_query(current_time, request.last_synced);
    let receipts = app
        .email_service
        .query_and_process_untracked(&request.email, queries, 3)
        .await
        .map_err(|err| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::error(format!(
                    "Failed to load sync receipts: {err}"
                ))),
            )
        })?;

    Ok(Json(ApiResponse::success(receipts)))
}
