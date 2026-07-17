use async_trait::async_trait;
use civictech_domain::{Report, ReportStatus, VerificationAction};
use thiserror::Error;
use uuid::Uuid;

#[derive(Debug, Error)]
pub enum UseCaseError {
    #[error("repository error: {0}")]
    Repository(String),
    #[error("domain error: {0}")]
    Domain(#[from] civictech_domain::DomainError),
}

#[async_trait]
pub trait ReportRepository: Send + Sync {
    async fn create_report(&self, category: String, description: String) -> Result<Report, String>;
    async fn get_status(&self, report_id: Uuid) -> Result<ReportStatus, String>;
    async fn update_status(&self, report_id: Uuid, new_status: ReportStatus) -> Result<(), String>;
}

pub async fn create_report(
    repo: &dyn ReportRepository,
    category: String,
    description: String,
) -> Result<Report, UseCaseError> {
    repo.create_report(category, description)
        .await
        .map_err(UseCaseError::Repository)
}

pub async fn apply_action(
    repo: &dyn ReportRepository,
    report_id: Uuid,
    action: VerificationAction,
) -> Result<ReportStatus, UseCaseError> {
    let current = repo
        .get_status(report_id)
        .await
        .map_err(UseCaseError::Repository)?;

    let mut report = Report {
        id: report_id,
        category: String::new(),
        description: String::new(),
        status: current,
    };

    report.apply(action)?;

    repo.update_status(report_id, report.status.clone())
        .await
        .map_err(UseCaseError::Repository)?;

    Ok(report.status)
}
