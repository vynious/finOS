use anyhow::Result;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};

use crate::common::{api_response::ApiResponse, app_state::AppState};
use crate::domain::receipt::models::ReceiptList;

pub async fn get_receipts_by_email(
    Path(email): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<ReceiptList>>, (StatusCode, Json<ApiResponse<()>>)> {
    match state.receipt_service.get_by(&email).await {
        Ok(receipts) => Ok(Json(ApiResponse::success(receipts))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(format!("Failed to get receipts: {}", e))),
        )),
    }
}
