use std::{env, path::PathBuf, sync::Arc};

use civictech_adapters_pg::PgStore;
use civictech_adapters_s3::S3EvidenceStore;
use civictech_auth::AuthService;

use crate::{metrics::ApiMetrics, state::AppState};

pub(crate) async fn build_state() -> AppState {
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/civictech".to_string());
    let municipality_id = env::var("MUNICIPALITY_ID").unwrap_or_else(|_| "demo-muni".to_string());
    let demo_csv_path =
        env::var("DEMO_INGEST_CSV").unwrap_or_else(|_| "fixtures/demo_expenses.csv".to_string());

    let pg = Arc::new(
        PgStore::connect(&database_url)
            .await
            .expect("failed to connect to postgres"),
    );

    let evidence_store = Arc::new(
        S3EvidenceStore::from_env()
            .await
            .expect("failed to initialize evidence presigner"),
    );

    let auth = Arc::new(AuthService::from_env());
    let app_metrics = Arc::new(ApiMetrics::new().expect("failed to initialize prometheus metrics"));

    AppState {
        pg,
        evidence_store,
        auth,
        metrics: app_metrics,
        municipality_id,
        demo_csv_path: PathBuf::from(demo_csv_path),
    }
}
