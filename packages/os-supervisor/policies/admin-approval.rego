# Admin — Human Resources Vertical Approval Policy
package arkelythex.vertical.admin

import future.keywords.if
import future.keywords.in

default decision := "gate"
default reason := "Default: requires human approval"

# Read operations — auto
decision := "allow" if {
	startswith(input.action, "employee:list")
}
reason := "Auto-approved: read operation" if {
	startswith(input.action, "employee:list")
}

decision := "allow" if {
	startswith(input.action, "employee:get")
}
reason := "Auto-approved: read operation" if {
	startswith(input.action, "employee:get")
}

# Create employee — auto (low risk)
decision := "allow" if {
	input.action == "employee:create"
}
reason := "Auto-approved: employee creation" if {
	input.action == "employee:create"
}

# Terminate employee — gate
decision := "gate" if {
	input.action == "employee:terminate"
}
reason := "Gate: employee termination requires approval" if {
	input.action == "employee:terminate"
}

# Salary changes — gate
decision := "gate" if {
	input.action == "employee:salary:update"
}
reason := "Gate: salary change requires approval" if {
	input.action == "employee:salary:update"
}

# Contract changes — gate
decision := "gate" if {
	input.action == "contract:update"
}
reason := "Gate: contract change requires approval" if {
	input.action == "contract:update"
}

# Expense approval — gate for medium risk
decision := "gate" if {
	input.action == "approve_expense"
	input.riskLevel == "medium"
}
reason := "Gate: expense requires approval" if {
	input.action == "approve_expense"
	input.riskLevel == "medium"
}

# High-risk operations — policy_gate
decision := "policy_gate" if {
	input.action in ["hire", "fire", "salary_change"]
}
reason := "Policy gate: high-risk HR operation requires governance review" if {
	input.action in ["hire", "fire", "salary_change"]
}
