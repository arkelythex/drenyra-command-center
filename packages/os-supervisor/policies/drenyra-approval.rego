# Drenyra — Fiscal Accounting Vertical Approval Policy
package arkelythex.vertical.drenyra

import future.keywords.if
import future.keywords.in

# Default: gate
default decision := "gate"
default reason := "Default: requires human approval"

# Read operations — always allow
decision := "allow" if {
	startswith(input.action, "invoice:list")
}
reason := "Auto-approved: read operation" if {
	startswith(input.action, "invoice:list")
}

decision := "allow" if {
	startswith(input.action, "invoice:get")
}
reason := "Auto-approved: read operation" if {
	startswith(input.action, "invoice:get")
}

# Invoice submission — risk-based
decision := "deny" if {
	input.action == "invoice:submit"
	input.amount > 1000000
}
reason := "Denied: invoice exceeds 1M threshold" if {
	input.action == "invoice:submit"
	input.amount > 1000000
}

decision := "gate" if {
	input.action == "invoice:submit"
	input.amount > 10000
	input.amount <= 1000000
}
reason := "Gate: invoice over 10k requires approval" if {
	input.action == "invoice:submit"
	input.amount > 10000
	input.amount <= 1000000
}

decision := "allow" if {
	input.action == "invoice:submit"
	input.amount <= 10000
}
reason := "Auto-approved: invoice under 10k" if {
	input.action == "invoice:submit"
	input.amount <= 10000
}

# SIRE submissions — always gate
decision := "gate" if {
	startswith(input.action, "sire:")
}
reason := "Gate: SIRE filings require review" if {
	startswith(input.action, "sire:")
}

# Low confidence on high-risk phases — gate even if action would auto-allow
decision := "gate" if {
	input.confidence != null
	input.phase_threshold != null
	input.confidence < input.phase_threshold
	input.action != "invoice:list"
	input.action != "invoice:get"
}
reason := sprintf(
	"Gate: confidence %.2f below phase threshold %.2f",
	[input.confidence, input.phase_threshold],
) if {
	input.confidence != null
	input.phase_threshold != null
	input.confidence < input.phase_threshold
	input.action != "invoice:list"
	input.action != "invoice:get"
}

# CPE operations
decision := "deny" if {
	input.action == "cpe:accept"
}
reason := "Denied: CPE acceptance requires direct human action" if {
	input.action == "cpe:accept"
}

decision := "allow" if {
	input.action == "cpe:query"
}
reason := "Auto-approved: CPE query" if {
	input.action == "cpe:query"
}
