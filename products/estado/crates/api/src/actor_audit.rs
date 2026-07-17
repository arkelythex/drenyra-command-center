use civictech_adapters_pg::AuditEventInput;
use civictech_auth::Principal;

use crate::state::AppState;

pub async fn append_actor_audit(
    state: &AppState,
    principal: &Principal,
    action: &str,
    target_type: &str,
    target_id: Option<String>,
    metadata: serde_json::Value,
) {
    if let Err(error) = state
        .pg
        .append_audit_event(AuditEventInput {
            actor_type: "user".to_string(),
            actor_id: Some(principal.subject.clone()),
            action: action.to_string(),
            target_type: target_type.to_string(),
            target_id,
            metadata,
        })
        .await
    {
        tracing::warn!(error = %error, "failed to append actor audit event");
    }
}
