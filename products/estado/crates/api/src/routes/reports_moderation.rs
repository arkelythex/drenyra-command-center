use axum::{
    extract::{Path, State},
    http::HeaderMap,
    Json,
};
use civictech_auth::Role;
use civictech_domain::{ReportStatus, VerificationAction};
use civictech_verify::next_status;
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    actor_audit::append_actor_audit,
    api_error::ApiError,
    authz::{authenticate, authorize},
    routes::reports_workflow::{
        action_label, observe_resolution_from_submitted, transition_report_state,
    },
    state::AppState,
};

pub async fn triage_report(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let principal = authenticate(&state, &headers).await?;
    authorize(
        &state,
        &principal,
        &[Role::Moderator, Role::Admin],
        "/moderation/cases/{id}/triage",
    )?;
    transition_report_state(&state, &id, VerificationAction::Triage, Some(&principal)).await
}

pub async fn verify_report(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let principal = authenticate(&state, &headers).await?;
    authorize(
        &state,
        &principal,
        &[Role::Moderator, Role::Admin],
        "/moderation/cases/{id}/verify",
    )?;
    transition_report_state(&state, &id, VerificationAction::Verify, Some(&principal)).await
}

#[derive(Deserialize)]
pub struct PublishReq {
    public_text: String,
}

pub async fn publish_report(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
    Json(req): Json<PublishReq>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let principal = authenticate(&state, &headers).await?;
    authorize(
        &state,
        &principal,
        &[Role::Moderator, Role::Admin],
        "/moderation/reports/{id}/publish",
    )?;

    if req.public_text.trim().is_empty() {
        return Err(ApiError::bad_request("public_text is required"));
    }

    let report_id = Uuid::parse_str(&id).map_err(|_| ApiError::bad_request("invalid report id"))?;
    let current = state
        .pg
        .report_status(report_id)
        .await
        .map_err(|error| ApiError::internal(format!("failed to fetch report: {error}")))?
        .ok_or_else(|| ApiError::not_found("report not found"))?;

    let next = next_status(current.clone(), VerificationAction::Publish)
        .map_err(|error| ApiError::conflict(format!("invalid transition: {error}")))?;

    let updated = state
        .pg
        .update_report_status(report_id, next.clone())
        .await
        .map_err(|error| ApiError::internal(format!("failed to update report status: {error}")))?;

    if !updated {
        return Err(ApiError::not_found("report not found"));
    }

    if let Err(error) = state
        .pg
        .append_report_status_event(
            report_id,
            current.as_db_str(),
            next.as_db_str(),
            action_label(VerificationAction::Publish),
        )
        .await
    {
        tracing::warn!(error = %error, "failed to append report status event");
    }

    state.metrics.observe_report_transition(
        current.as_db_str(),
        next.as_db_str(),
        action_label(VerificationAction::Publish),
    );
    state.metrics.observe_workflow_outcome("published");
    observe_resolution_from_submitted(&state, report_id, "published").await;

    let publication = state
        .pg
        .create_publication(report_id, &req.public_text)
        .await
        .map_err(|error| ApiError::internal(format!("failed to publish report: {error}")))?;

    append_actor_audit(
        &state,
        &principal,
        "report_publish",
        "report",
        Some(report_id.to_string()),
        serde_json::json!({ "publication_id": publication.id }),
    )
    .await;

    Ok(Json(serde_json::json!({
        "report_id": report_id,
        "status": ReportStatus::Published.as_db_str(),
        "publication": publication
    })))
}
