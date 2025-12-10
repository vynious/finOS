use std::sync::Arc;

use anyhow::Result;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Deserialize;

use crate::common::{api_response::ApiResponse, app_state::AppState};

#[derive(Deserialize)]
pub struct UpdateCategories {
    pub categories: Vec<String>,
}

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

pub async fn update_receipt_categories(
    Path(receipt_id): Path<String>,
    State(state): State<Arc<AppState>>,
    Json(request): Json<UpdateCategories>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    match state
        .receipt_service
        .update_categories(&receipt_id, request.categories)
        .await
    {
        Ok(_) => Ok(Json(ApiResponse::success(()))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(format!(
                "Failed to update categories: {}",
                e
            ))),
        )),
    }
}
