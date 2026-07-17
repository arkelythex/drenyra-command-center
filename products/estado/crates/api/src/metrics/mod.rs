mod auth;
mod domain;
mod http;

use axum::http::StatusCode;
use prometheus::{Encoder, Registry, TextEncoder};

use crate::api_error::ApiError;

use self::{auth::AuthMetrics, domain::DomainMetrics, http::HttpMetrics};

pub struct ApiMetrics {
    registry: Registry,
    http: HttpMetrics,
    auth: AuthMetrics,
    domain: DomainMetrics,
}

impl ApiMetrics {
    pub fn new() -> Result<Self, prometheus::Error> {
        let registry = Registry::new();
        let http = HttpMetrics::register(&registry)?;
        let auth = AuthMetrics::register(&registry)?;
        let domain = DomainMetrics::register(&registry)?;

        Ok(Self {
            registry,
            http,
            auth,
            domain,
        })
    }

    pub fn observe_http(
        &self,
        method: &str,
        route: &str,
        status: StatusCode,
        duration_seconds: f64,
    ) {
        self.http.observe(method, route, status, duration_seconds);
    }

    pub fn observe_auth_decision(&self, decision: &str, endpoint: &str) {
        self.auth.observe_decision(decision, endpoint);
    }

    pub fn observe_report_transition(&self, from_status: &str, to_status: &str, action: &str) {
        self.domain
            .observe_report_transition(from_status, to_status, action);
    }

    pub fn observe_workflow_outcome(&self, outcome: &str) {
        self.domain.observe_workflow_outcome(outcome);
    }

    pub fn observe_ingest_success(&self, rows_ingested: u64, duration_seconds: f64) {
        self.domain
            .observe_ingest_success(rows_ingested, duration_seconds);
    }

    pub fn observe_ingest_failure(&self, duration_seconds: f64) {
        self.domain.observe_ingest_failure(duration_seconds);
    }

    pub fn observe_report_resolution(&self, outcome: &str, duration_seconds: f64) {
        self.domain
            .observe_report_resolution(outcome, duration_seconds);
    }

    pub fn render(&self) -> Result<String, ApiError> {
        let metric_families = self.registry.gather();
        let mut buffer = Vec::new();
        TextEncoder::new()
            .encode(&metric_families, &mut buffer)
            .map_err(|error| ApiError::internal(format!("failed to encode metrics: {error}")))?;

        String::from_utf8(buffer)
            .map_err(|error| ApiError::internal(format!("invalid metrics encoding: {error}")))
    }
}
