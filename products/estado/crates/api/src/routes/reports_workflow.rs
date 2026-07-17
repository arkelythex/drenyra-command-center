use chrono::Utc;
use civictech_auth::Principal;
use civictech_domain::{ReportStatus, VerificationAction};
use civictech_verify::next_status;
use uuid::Uuid;

use crate::{actor_audit::append_actor_audit, api_error::ApiError, state::AppState};

pub async fn transition_report_state(
    state: &AppState,
    id: &str,
    action: VerificationAction,
    principal: Option<&Principal>,
) -> Result<axum::Json<serde_json::Value>, ApiError> {
    let report_id = Uuid::parse_str(id).map_err(|_| ApiError::bad_request("invalid report id"))?;

    let current = state
        .pg
        .report_status(report_id)
        .await
        .map_err(|error| ApiError::internal(format!("failed to fetch report status: {error}")))?
        .ok_or_else(|| ApiError::not_found("report not found"))?;

    let next = next_status(current.clone(), action)
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
            action_label(action),
        )
        .await
    {
        tracing::warn!(error = %error, "failed to append report status event");
    }

    state.metrics.observe_report_transition(
        current.as_db_str(),
        next.as_db_str(),
        action_label(action),
    );

    if next == ReportStatus::Published {
        state.metrics.observe_workflow_outcome("published");
        observe_resolution_from_submitted(state, report_id, "published").await;
    } else if next == ReportStatus::Rejected {
        state.metrics.observe_workflow_outcome("rejected");
        observe_resolution_from_submitted(state, report_id, "rejected").await;
    }

    if let Some(principal) = principal {
        append_actor_audit(
            state,
            principal,
            "report_transition",
            "report",
            Some(report_id.to_string()),
            serde_json::json!({ "to_status": next.as_db_str() }),
        )
        .await;
    }

    Ok(axum::Json(serde_json::json!({
        "id": report_id,
        "status": next.as_db_str()
    })))
}

pub async fn observe_resolution_from_submitted(state: &AppState, report_id: Uuid, outcome: &str) {
    match state
        .pg
        .first_transition_to_status_at(report_id, ReportStatus::Submitted.as_db_str())
        .await
    {
        Ok(Some(submitted_at)) => {
            let duration = Utc::now().signed_duration_since(submitted_at);
            let duration_ms = duration.num_milliseconds();
            if duration_ms >= 0 {
                state
                    .metrics
                    .observe_report_resolution(outcome, duration_ms as f64 / 1000.0);
            }
        }
        Ok(None) => {
            tracing::warn!(%report_id, "submitted transition not found for resolution metric");
        }
        Err(error) => {
            tracing::warn!(error = %error, %report_id, "failed to fetch submitted transition");
        }
    }
}

pub fn action_label(action: VerificationAction) -> &'static str {
    match action {
        VerificationAction::Submit => "submit",
        VerificationAction::Triage => "triage",
        VerificationAction::Verify => "verify",
        VerificationAction::Reject => "reject",
        VerificationAction::Publish => "publish",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn action_label_maps_publish() {
        assert_eq!(action_label(VerificationAction::Publish), "publish");
    }
}
