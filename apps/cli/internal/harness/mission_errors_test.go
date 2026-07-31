package harness

import (
	"fmt"
	"testing"
)

func TestParseMissionError(t *testing.T) {
	tests := []struct {
		code       string
		message    string
		statusCode int
		wantFamily string
		wantRetry  bool
	}{
		{"UNAUTHORIZED", "not logged in", 401, "AUTH", false},
		{"VERSION_CONFLICT", "stale version", 409, "CONCURRENCY", true},
		{"HARNESS_TIMEOUT", "timeout", 504, "EXTERNAL_SYSTEM", true},
		{"INVALID_INPUT", "bad data", 400, "VALIDATION", false},
		{"TENANT_MISMATCH", "wrong org", 403, "TENANT", false},
		{"MISSION_NOT_FOUND", "not found", 404, "VALIDATION", false},
		{"IDEMPOTENCY_CONFLICT", "duplicate", 409, "IDEMPOTENCY", false},
		{"EVIDENCE_MISMATCH", "hash mismatch", 409, "EVIDENCE", false},
		{"PROPOSAL_VERSION_CONFLICT", "stale proposal", 409, "APPROVAL", false},
		{"UNKNOWN_CODE", "unknown", 500, "UNKNOWN", false},
	}

	for _, tt := range tests {
		t.Run(tt.code, func(t *testing.T) {
			err := ParseMissionError(tt.code, tt.message, tt.statusCode, nil)
			if err.Code != tt.code {
				t.Errorf("code = %q, want %q", err.Code, tt.code)
			}
			if err.Family() != tt.wantFamily {
				t.Errorf("family = %q, want %q", err.Family(), tt.wantFamily)
			}
			if err.IsRetryable() != tt.wantRetry {
				t.Errorf("retryable = %v, want %v", err.IsRetryable(), tt.wantRetry)
			}
			if err.StatusCode != tt.statusCode {
				t.Errorf("statusCode = %d, want %d", err.StatusCode, tt.statusCode)
			}
			if err.Error() == "" {
				t.Error("Error() returned empty string")
			}
		})
	}
}

func TestExitCodeForError(t *testing.T) {
	tests := []struct {
		name     string
		err      error
		wantCode int
	}{
		{"nil", nil, 0},
		{"invalid input", ParseMissionError("INVALID_INPUT", "", 400, nil), 2},
		{"auth", ParseMissionError("UNAUTHORIZED", "", 401, nil), 3},
		{"token expired", ParseMissionError("TOKEN_EXPIRED", "", 401, nil), 3},
		{"authorization", ParseMissionError("INSUFFICIENT_SCOPE", "", 403, nil), 4},
		{"version conflict", ParseMissionError("VERSION_CONFLICT", "", 409, nil), 5},
		{"gate blocking", ParseMissionError("TERMINAL_STATE_GUARD", "", 409, nil), 6},
		{"unknown state", ParseMissionError("UNKNOWN_STATE", "", 500, nil), 7},
		{"retryable external", ParseMissionError("HARNESS_TIMEOUT", "", 504, nil), 8},
		{"terminal", fmt.Errorf("generic error"), 9},
		{"unknown code", ParseMissionError("SOMETHING_ELSE", "", 500, nil), 9},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ExitCodeForError(tt.err)
			if got != tt.wantCode {
				t.Errorf("exit code = %d, want %d", got, tt.wantCode)
			}
		})
	}
}
