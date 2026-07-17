# Kuse — Coworking Space Vertical Approval Policy
package arkelythex.vertical.kuse

import future.keywords.if
import future.keywords.in

default decision := "gate"
default reason := "Default: requires human approval"

# Read operations — auto
decision := "allow" if {
	startswith(input.action, "space:list")
}
reason := "Auto-approved: read operation" if {
	startswith(input.action, "space:list")
}

decision := "allow" if {
	input.action == "space:search"
}
reason := "Auto-approved: space search" if {
	input.action == "space:search"
}

# Booking — auto for standard
decision := "allow" if {
	input.action == "booking:create"
}
reason := "Auto-approved: standard booking" if {
	input.action == "booking:create"
}

# Booking cancellation — auto
decision := "allow" if {
	input.action == "booking:cancel"
}
reason := "Auto-approved: booking cancellation" if {
	input.action == "booking:cancel"
}

# Membership changes — gate
decision := "gate" if {
	startswith(input.action, "membership:")
}
reason := "Gate: membership changes require approval" if {
	startswith(input.action, "membership:")
}

# Billing operations — gate
decision := "gate" if {
	startswith(input.action, "billing:")
}
reason := "Gate: billing operations require approval" if {
	startswith(input.action, "billing:")
}
