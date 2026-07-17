use std::{path::PathBuf, sync::Arc};

use civictech_adapters_pg::PgStore;
use civictech_adapters_s3::S3EvidenceStore;
use civictech_auth::AuthService;

use crate::metrics::ApiMetrics;

#[derive(Clone)]
pub(crate) struct AppState {
    pub(crate) pg: Arc<PgStore>,
    pub(crate) evidence_store: Arc<S3EvidenceStore>,
    pub(crate) auth: Arc<AuthService>,
    pub(crate) metrics: Arc<ApiMetrics>,
    pub(crate) municipality_id: String,
    pub(crate) demo_csv_path: PathBuf,
}
