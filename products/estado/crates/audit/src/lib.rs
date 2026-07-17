use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEvent {
    pub id: uuid::Uuid,
    pub action: String,
    pub target_type: String,
    pub target_id: Option<String>,
    pub actor_id: Option<String>,
    pub metadata: serde_json::Value,
}
