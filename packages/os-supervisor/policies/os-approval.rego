# ARKELYTHEX OS — Default Approval Policy
# This policy is evaluated when no vertical-specific policy exists.
package arkelythex.os

import future.keywords.if
import future.keywords.in

# Default: gate (all actions require human approval by default)
default decision := "gate"
default reason := "Default policy: human approval required"

# Allow operations explicitly marked as auto or notify
decision := "allow" if {
	input.approvalLevel == "auto"
}
reason := "Auto-approved: low-risk operation" if {
	input.approvalLevel == "auto"
}

decision := "allow" if {
	input.approvalLevel == "notify"
}
reason := "Auto-approved: notification level" if {
	input.approvalLevel == "notify"
}

# Policy gate requires governance review
decision := "gate" if {
	input.approvalLevel == "policy_gate"
}
reason := "Policy gate: requires governance review" if {
	input.approvalLevel == "policy_gate"
}

# Gate for any non-auto, non-notify by default
decision := "gate" if {
	input.approvalLevel == "gate"
}
reason := "Gate: human approval required" if {
	input.approvalLevel == "gate"
}
