use axum::{
    extract::{Path, State},
    response::IntoResponse,
    Json,
};
use civictech_domain::VerificationAction;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    api_error::ApiError, routes::reports_workflow::transition_report_state, state::AppState,
};

#[derive(Deserialize)]
pub struct CreateReportReq {
    category: String,
    description: String,
}

pub async fn create_report(
    State(state): State<AppState>,
    Json(req): Json<CreateReportReq>,
) -> Result<impl IntoResponse, ApiError> {
    if req.category.trim().is_empty() || req.description.trim().is_empty() {
        return Err(ApiError::bad_request(
            "category and description are required",
        ));
    }

    let created = state
        .pg
        .create_report(&req.category, &req.description)
        .await
        .map_err(|error| ApiError::internal(format!("failed to create report: {error}")))?;

    Ok((axum::http::StatusCode::CREATED, Json(created)))
}

#[derive(Deserialize)]
pub struct UploadEvidenceReq {
    content_type: Option<String>,
    sha256: Option<String>,
}

#[derive(Serialize)]
pub struct UploadEvidenceRes {
    report_id: String,
    evidence_id: String,
    upload_url: String,
    object_key: String,
    expires_in_seconds: u64,
}

pub async fn upload_evidence(
    State(state): State<AppState>,
    Path(id): Path<String>,
    req: Option<Json<UploadEvidenceReq>>,
) -> Result<Json<UploadEvidenceRes>, ApiError> {
    let report_id = Uuid::parse_str(&id).map_err(|_| ApiError::bad_request("invalid report id"))?;
    let req = req.map(|json| json.0).unwrap_or(UploadEvidenceReq {
        content_type: None,
        sha256: None,
    });

    let presigned = state
        .evidence_store
        .presign_put_for_report(report_id, req.content_type.as_deref())
        .await
        .map_err(|error| ApiError::internal(format!("failed to create upload URL: {error}")))?;

    let evidence_id = state
        .pg
        .register_evidence(
            report_id,
            &state.evidence_store.storage_ref(&presigned.object_key),
            req.sha256.as_deref().unwrap_or("pending"),
        )
        .await
        .map_err(|error| ApiError::internal(format!("failed to register evidence: {error}")))?;

    Ok(Json(UploadEvidenceRes {
        report_id: report_id.to_string(),
        evidence_id: evidence_id.to_string(),
        upload_url: presigned.upload_url,
        object_key: presigned.object_key,
        expires_in_seconds: presigned.expires_in_seconds,
    }))
}

pub async fn submit_report(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, ApiError> {
    transition_report_state(&state, &id, VerificationAction::Submit, None).await
}
