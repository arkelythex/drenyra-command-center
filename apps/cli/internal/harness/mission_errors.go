package harness

import "fmt"

// Canonical error code families for the mission protocol.
// Matches the @drenyra/mission-protocol TypeScript error taxonomy.
type MissionErrorFamily string

const (
	ErrorFamilyAuth           MissionErrorFamily = "AUTH"
	ErrorFamilyTenant         MissionErrorFamily = "TENANT"
	ErrorFamilyValidation     MissionErrorFamily = "VALIDATION"
	ErrorFamilyConcurrency    MissionErrorFamily = "CONCURRENCY"
	ErrorFamilyIdempotency    MissionErrorFamily = "IDEMPOTENCY"
	ErrorFamilyMissionState   MissionErrorFamily = "MISSION_STATE"
	ErrorFamilyEvidence       MissionErrorFamily = "EVIDENCE"
	ErrorFamilyApproval       MissionErrorFamily = "APPROVAL"
	ErrorFamilyExternalSystem MissionErrorFamily = "EXTERNAL_SYSTEM"
)

// MissionError represents a typed error from the mission protocol.
// It carries a machine-readable code, family, HTTP status, and optional details.
// Matches the @drenyra/mission-protocol MissionError type.
type MissionError struct {
	Code       string                 `json:"code"`
	Message    string                 `json:"message"`
	StatusCode int                    `json:"statusCode"`
	Details    map[string]interface{} `json:"details,omitempty"`
	family     string
	retryable  bool
}

func (e *MissionError) Error() string {
	return fmt.Sprintf("[%s] %s: %s", e.family, e.Code, e.Message)
}

// Family returns the error family.
func (e *MissionError) Family() string { return e.family }

// IsRetryable returns true if the error is safe to retry.
func (e *MissionError) IsRetryable() bool { return e.retryable }

// ParseMissionError parses a typed mission error from the API response envelope.
// It maps the error code to family, status code, and retryability.
func ParseMissionError(code, message string, statusCode int, details map[string]interface{}) *MissionError {
	family := familyForCode(code)
	return &MissionError{
		Code:       code,
		Message:    message,
		StatusCode: statusCode,
		Details:    details,
		family:     family,
		retryable:  isRetryableCode(code),
	}
}

// familyForCode maps an error code string to its error family.
func familyForCode(code string) string {
	switch code {
	case "UNAUTHORIZED", "TOKEN_EXPIRED", "TOKEN_REVOKED", "INSUFFICIENT_SCOPE":
		return string(ErrorFamilyAuth)
	case "TENANT_MISMATCH", "ORGANIZATION_NOT_FOUND", "COMPANY_NOT_FOUND":
		return string(ErrorFamilyTenant)
	case "INVALID_INPUT", "MISSION_NOT_FOUND", "INVALID_PERIOD", "INVALID_INTENT":
		return string(ErrorFamilyValidation)
	case "VERSION_CONFLICT", "ALREADY_EXECUTING", "TERMINAL_STATE_GUARD":
		return string(ErrorFamilyConcurrency)
	case "IDEMPOTENCY_CONFLICT":
		return string(ErrorFamilyIdempotency)
	case "INVALID_TRANSITION", "MISSION_STATE_CONFLICT", "UNKNOWN_STATE", "RECONCILIATION_FAILED":
		return string(ErrorFamilyMissionState)
	case "EVIDENCE_MISMATCH", "EVIDENCE_NOT_FOUND", "EVIDENCE_EXPIRED":
		return string(ErrorFamilyEvidence)
	case "APPROVAL_ALREADY_DECIDED", "APPROVAL_INVALID_SIGNER", "PROPOSAL_VERSION_CONFLICT", "PROPOSAL_EXPIRED":
		return string(ErrorFamilyApproval)
	case "HARNESS_TIMEOUT", "EXTERNAL_SERVICE_UNAVAILABLE", "SSE_CONNECTION_LOST", "RECEIPT_VERIFICATION":
		return string(ErrorFamilyExternalSystem)
	default:
		return "UNKNOWN"
	}
}

// isRetryableCode returns true if the error code represents a retryable failure.
func isRetryableCode(code string) bool {
	switch code {
	case "HARNESS_TIMEOUT", "EXTERNAL_SERVICE_UNAVAILABLE", "SSE_CONNECTION_LOST", "VERSION_CONFLICT":
		return true
	default:
		return false
	}
}

// Stable execution exit codes for CI/script use.
// 0 = success, 2+ = specific failure modes.
const (
	ExitCodeSuccess             = 0
	ExitCodeInvalidInput        = 2
	ExitCodeAuth                = 3
	ExitCodeAuthorization       = 4
	ExitCodeVersionConflict     = 5
	ExitCodeGateBlocking        = 6
	ExitCodeUnknownState        = 7
	ExitCodeExternalRetryable   = 8
	ExitCodeTerminalFailure     = 9
)

// ExitCodeForError returns a stable exit code for a given error.
func ExitCodeForError(err error) int {
	if err == nil {
		return ExitCodeSuccess
	}
	if me, ok := err.(*MissionError); ok {
		switch me.Code {
		case "INVALID_INPUT", "INVALID_PERIOD", "INVALID_INTENT":
			return ExitCodeInvalidInput
		case "UNAUTHORIZED", "TOKEN_EXPIRED", "TOKEN_REVOKED":
			return ExitCodeAuth
		case "INSUFFICIENT_SCOPE", "TENANT_MISMATCH":
			return ExitCodeAuthorization
		case "VERSION_CONFLICT", "IDEMPOTENCY_CONFLICT":
			return ExitCodeVersionConflict
		case "TERMINAL_STATE_GUARD", "INVALID_TRANSITION", "MISSION_STATE_CONFLICT":
			return ExitCodeGateBlocking
		case "UNKNOWN_STATE", "RECONCILIATION_FAILED":
			return ExitCodeUnknownState
		case "HARNESS_TIMEOUT", "EXTERNAL_SERVICE_UNAVAILABLE", "SSE_CONNECTION_LOST":
			return ExitCodeExternalRetryable
		default:
			return ExitCodeTerminalFailure
		}
	}
	return ExitCodeTerminalFailure
}
