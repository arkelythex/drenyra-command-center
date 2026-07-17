use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ReportStatus {
    Draft,
    Submitted,
    Triaged,
    Verified,
    Rejected,
    Published,
}

impl ReportStatus {
    pub fn as_db_str(&self) -> &'static str {
        match self {
            Self::Draft => "DRAFT",
            Self::Submitted => "SUBMITTED",
            Self::Triaged => "TRIAGED",
            Self::Verified => "VERIFIED",
            Self::Rejected => "REJECTED",
            Self::Published => "PUBLISHED",
        }
    }

    pub fn from_db_str(value: &str) -> Result<Self, DomainError> {
        match value {
            "DRAFT" => Ok(Self::Draft),
            "SUBMITTED" => Ok(Self::Submitted),
            "TRIAGED" => Ok(Self::Triaged),
            "VERIFIED" => Ok(Self::Verified),
            "REJECTED" => Ok(Self::Rejected),
            "PUBLISHED" => Ok(Self::Published),
            _ => Err(DomainError::UnknownStatus(value.to_string())),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Report {
    pub id: uuid::Uuid,
    pub category: String,
    pub description: String,
    pub status: ReportStatus,
}

#[derive(Debug, Clone, Copy)]
pub enum VerificationAction {
    Submit,
    Triage,
    Verify,
    Reject,
    Publish,
}

#[derive(Debug, Error)]
pub enum DomainError {
    #[error("invalid report transition from {from:?} via {action:?}")]
    InvalidTransition {
        from: ReportStatus,
        action: VerificationAction,
    },
    #[error("unknown status value: {0}")]
    UnknownStatus(String),
}

impl Report {
    pub fn new(category: String, description: String) -> Self {
        Self {
            id: uuid::Uuid::new_v4(),
            category,
            description,
            status: ReportStatus::Draft,
        }
    }

    pub fn apply(&mut self, action: VerificationAction) -> Result<(), DomainError> {
        self.status = transition(self.status.clone(), action)?;
        Ok(())
    }
}

pub fn transition(
    current: ReportStatus,
    action: VerificationAction,
) -> Result<ReportStatus, DomainError> {
    match (current.clone(), action) {
        (ReportStatus::Draft, VerificationAction::Submit) => Ok(ReportStatus::Submitted),
        (ReportStatus::Submitted, VerificationAction::Triage) => Ok(ReportStatus::Triaged),
        (ReportStatus::Triaged, VerificationAction::Verify) => Ok(ReportStatus::Verified),
        (ReportStatus::Submitted, VerificationAction::Reject) => Ok(ReportStatus::Rejected),
        (ReportStatus::Triaged, VerificationAction::Reject) => Ok(ReportStatus::Rejected),
        (ReportStatus::Verified, VerificationAction::Publish) => Ok(ReportStatus::Published),
        (_, action) => Err(DomainError::InvalidTransition {
            from: current,
            action,
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::{transition, ReportStatus, VerificationAction};

    #[test]
    fn report_happy_path() {
        let status = transition(ReportStatus::Draft, VerificationAction::Submit)
            .and_then(|s| transition(s, VerificationAction::Triage))
            .and_then(|s| transition(s, VerificationAction::Verify))
            .and_then(|s| transition(s, VerificationAction::Publish))
            .expect("transition chain should be valid");

        assert_eq!(status, ReportStatus::Published);
    }

    #[test]
    fn rejects_invalid_transition() {
        let result = transition(ReportStatus::Draft, VerificationAction::Publish);
        assert!(result.is_err());
    }

    #[test]
    fn can_reject_after_triage() {
        let status = transition(ReportStatus::Triaged, VerificationAction::Reject)
            .expect("reject after triage should be valid");
        assert_eq!(status, ReportStatus::Rejected);
    }

    #[test]
    fn cannot_verify_without_triage() {
        let result = transition(ReportStatus::Submitted, VerificationAction::Verify);
        assert!(result.is_err());
    }
}
