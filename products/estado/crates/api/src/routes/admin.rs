use axum::{extract::State, http::HeaderMap, Json};
use civictech_auth::Role;
use civictech_ingest::load_csv_with_checksum;
use std::time::Instant;

use crate::{
    actor_audit::append_actor_audit,
    api_error::ApiError,
    authz::{authenticate, authorize},
    state::AppState,
};

pub async fn ingest_demo(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<serde_json::Value>, ApiError> {
    let principal = authenticate(&state, &headers).await?;
    authorize(&state, &principal, &[Role::Admin], "/admin/ingest/demo")?;
    let started = Instant::now();

    let (checksum, rows) = match load_csv_with_checksum(&state.demo_csv_path) {
        Ok(data) => data,
        Err(error) => {
            state
                .metrics
                .observe_ingest_failure(started.elapsed().as_secs_f64());
            return Err(ApiError::internal(format!(
                "failed to read demo csv: {error}"
            )));
        }
    };

    let version_id = match state
        .pg
        .ingest_expense_rows(
            "Municipio Demo",
            "csv_upload",
            Some("file://fixtures/demo_expenses.csv"),
            &checksum,
            &rows,
        )
        .await
    {
        Ok(version_id) => version_id,
        Err(error) => {
            state
                .metrics
                .observe_ingest_failure(started.elapsed().as_secs_f64());
            return Err(ApiError::internal(format!(
                "failed to ingest rows: {error}"
            )));
        }
    };

    append_actor_audit(
        &state,
        &principal,
        "dataset_ingest_demo",
        "dataset_version",
        Some(version_id.to_string()),
        serde_json::json!({ "rows_ingested": rows.len(), "checksum_sha256": checksum }),
    )
    .await;
    state
        .metrics
        .observe_ingest_success(rows.len() as u64, started.elapsed().as_secs_f64());

    Ok(Json(serde_json::json!({
        "municipality_id": state.municipality_id,
        "dataset_version_id": version_id,
        "checksum_sha256": checksum,
        "rows_ingested": rows.len()
    })))
}
