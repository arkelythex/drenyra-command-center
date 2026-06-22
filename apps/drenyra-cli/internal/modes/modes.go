package modes

import "strings"

// Mode describes the execution intent for a Drenyra CLI task.
type Mode string

const (
	Plan  Mode = "plan"
	Build Mode = "build"
)

// Normalize returns a supported mode, defaulting to Build.
func Normalize(value string) Mode {
	switch Mode(strings.ToLower(strings.TrimSpace(value))) {
	case Plan:
		return Plan
	case Build:
		return Build
	default:
		return Build
	}
}

// Label returns user-facing mode text.
func (m Mode) Label() string {
	if Normalize(string(m)) == Plan {
		return "Plan"
	}
	return "Build"
}

// Toggle flips between Plan and Build.
func (m Mode) Toggle() Mode {
	if Normalize(string(m)) == Plan {
		return Build
	}
	return Plan
}

// Policy captures mode-level execution constraints.
type Policy struct {
	Mode     Mode
	ReadOnly bool
}

// Policy returns execution constraints for the mode.
func (m Mode) Policy() Policy {
	mode := Normalize(string(m))
	return Policy{Mode: mode, ReadOnly: mode == Plan}
}

// ApplyToTask returns the task text sent to the harness plus reusable policy metadata.
func ApplyToTask(task string, mode Mode) (string, Policy) {
	policy := mode.Policy()
	if !policy.ReadOnly {
		return task, policy
	}
	return "PLAN MODE (read-only): analyze this request, propose a safe implementation plan, identify risks and verification steps, and do not apply code or data changes. Request: " + task, policy
}
