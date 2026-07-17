use axum::{
    extract::State,
    http::{HeaderValue, Request},
    middleware::Next,
    response::Response,
};
use civictech_adapters_pg::AuditEventInput;
use std::time::Instant;
use uuid::Uuid;

use crate::state::AppState;

pub async fn audit_middleware(
    State(state): State<AppState>,
    req: Request<axum::body::Body>,
    next: Next,
) -> Response {
    let trace_id = Uuid::new_v4().to_string();
    let started_at = Instant::now();
    let method = req.method().to_string();
    let path = req.uri().path().to_string();
    let normalized_route = normalize_route(&path);

    let mut response = next.run(req).await;
    let status = response.status();
    let status_code = status.as_u16();

    let metadata = serde_json::json!({
        "trace_id": trace_id.clone(),
        "http_method": method.clone(),
        "http_path": path.clone(),
        "status": status_code
    });

    if let Err(error) = state
        .pg
        .append_audit_event(AuditEventInput {
            actor_type: "system".to_string(),
            actor_id: None,
            action: "http_request".to_string(),
            target_type: "http_endpoint".to_string(),
            target_id: Some(path),
            metadata,
        })
        .await
    {
        tracing::warn!(error = %error, "failed to append audit event");
    }

    state.metrics.observe_http(
        &method,
        &normalized_route,
        status,
        started_at.elapsed().as_secs_f64(),
    );

    if let Ok(header_value) = HeaderValue::from_str(&trace_id) {
        response.headers_mut().insert("x-trace-id", header_value);
    }

    response
}

fn normalize_route(path: &str) -> String {
    path.split('/')
        .map(|segment| {
            if Uuid::parse_str(segment).is_ok() {
                "{id}"
            } else {
                segment
            }
        })
        .collect::<Vec<_>>()
        .join("/")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_route_replaces_uuid_segments() {
        let route = normalize_route("/reports/550e8400-e29b-41d4-a716-446655440000/submit");
        assert_eq!(route, "/reports/{id}/submit");
    }
}
