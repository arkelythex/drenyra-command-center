use axum::{
    middleware::from_fn_with_state,
    routing::{get, post},
    Router,
};

use crate::{middleware, state::AppState};

pub mod admin;
pub mod public;
pub mod reports_moderation;
pub mod reports_submission;
pub mod reports_workflow;

pub(crate) fn build_router(state: AppState) -> Router {
    Router::new()
        .route("/health", get(public::health))
        .route("/metrics", get(public::metrics_endpoint))
        .route("/public/datasets", get(public::list_datasets))
        .route("/public/expenses", get(public::query_expenses))
        .route("/reports", post(reports_submission::create_report))
        .route(
            "/reports/{id}/evidence",
            post(reports_submission::upload_evidence),
        )
        .route(
            "/reports/{id}/submit",
            post(reports_submission::submit_report),
        )
        .route(
            "/moderation/cases/{id}/triage",
            post(reports_moderation::triage_report),
        )
        .route(
            "/moderation/cases/{id}/verify",
            post(reports_moderation::verify_report),
        )
        .route(
            "/moderation/reports/{id}/publish",
            post(reports_moderation::publish_report),
        )
        .route("/public/reports", get(public::list_public_reports))
        .route("/admin/ingest/demo", post(admin::ingest_demo))
        .with_state(state.clone())
        .layer(from_fn_with_state(state, middleware::audit_middleware))
}
