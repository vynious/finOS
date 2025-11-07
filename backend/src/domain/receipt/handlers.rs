use std::sync::Arc;

use anyhow::Result;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};

use crate::common::{api_response::ApiResponse, app_state::AppState};

pub async fn get_receipts_by_email(
    Path(email): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    match state.receipt_service.get_by(&email).await {
        Ok(receipts) => Ok(Json(ApiResponse::success(receipts))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(format!("Failed to get receipts: {}", e))),
        )),
    }
}
