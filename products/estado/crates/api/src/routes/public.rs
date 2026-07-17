use axum::{
    extract::{Query, State},
    http::{HeaderMap, HeaderValue, StatusCode},
    response::IntoResponse,
    Json,
};
use serde::Deserialize;

use crate::{api_error::ApiError, state::AppState};

pub async fn health() -> impl IntoResponse {
    (StatusCode::OK, "ok")
}

pub async fn metrics_endpoint(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, ApiError> {
    let payload = state.metrics.render()?;
    let mut headers = HeaderMap::new();
    headers.insert(
        axum::http::header::CONTENT_TYPE,
        HeaderValue::from_static("text/plain; version=0.0.4; charset=utf-8"),
    );
    Ok((headers, payload))
}

pub async fn list_datasets(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let items = state
        .pg
        .list_datasets()
        .await
        .map_err(|error| ApiError::internal(format!("failed to list datasets: {error}")))?;

    if items.is_empty() {
        return Ok(Json(serde_json::json!([
            {
                "id": "demo",
                "name": format!("{} - gastos", state.municipality_id),
                "versions": 0
            }
        ])));
    }

    Ok(Json(serde_json::to_value(items).map_err(|error| {
        ApiError::internal(format!("serialization failure: {error}"))
    })?))
}

#[derive(Deserialize)]
pub struct ExpenseQuery {
    entity: Option<String>,
    category: Option<String>,
}

pub async fn query_expenses(
    State(state): State<AppState>,
    Query(query): Query<ExpenseQuery>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let items = state
        .pg
        .query_expenses(query.entity.as_deref(), query.category.as_deref())
        .await
        .map_err(|error| ApiError::internal(format!("failed to query expenses: {error}")))?;

    Ok(Json(serde_json::to_value(items).map_err(|error| {
        ApiError::internal(format!("serialization failure: {error}"))
    })?))
}

pub async fn list_public_reports(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let items =
        state.pg.list_public_reports().await.map_err(|error| {
            ApiError::internal(format!("failed to list public reports: {error}"))
        })?;

    Ok(Json(serde_json::to_value(items).map_err(|error| {
        ApiError::internal(format!("serialization failure: {error}"))
    })?))
}
