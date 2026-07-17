use civictech_domain::{transition, DomainError, ReportStatus, VerificationAction};

pub fn next_status(
    current: ReportStatus,
    action: VerificationAction,
) -> Result<ReportStatus, DomainError> {
    transition(current, action)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn triage_after_submit_is_valid() {
        let submitted = next_status(ReportStatus::Draft, VerificationAction::Submit)
            .expect("submit should be valid");
        let triaged =
            next_status(submitted, VerificationAction::Triage).expect("triage should be valid");

        assert_eq!(triaged, ReportStatus::Triaged);
    }

    #[test]
    fn full_workflow_publish_is_valid() {
        let status = next_status(ReportStatus::Draft, VerificationAction::Submit)
            .and_then(|s| next_status(s, VerificationAction::Triage))
            .and_then(|s| next_status(s, VerificationAction::Verify))
            .and_then(|s| next_status(s, VerificationAction::Publish))
            .expect("full publish workflow should be valid");

        assert_eq!(status, ReportStatus::Published);
    }

    #[test]
    fn publish_without_verify_is_invalid() {
        let result = next_status(ReportStatus::Triaged, VerificationAction::Publish);
        assert!(result.is_err());
    }

    #[test]
    fn reject_from_submitted_is_valid() {
        let status = next_status(ReportStatus::Submitted, VerificationAction::Reject)
            .expect("reject from submitted should be valid");
        assert_eq!(status, ReportStatus::Rejected);
    }
}
