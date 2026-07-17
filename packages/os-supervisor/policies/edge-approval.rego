package arkelythex.vertical.edge

import future.keywords.in

default decision := "gate"

# Auto-grant for read-only and status operations
decision := "allow" if {
	input.action in ["lot:list", "lot:get", "audit:list", "audit:get", "report:generate"]
}

# Gate operations require human confirmation
decision := "gate" if {
	input.action in ["lot:create", "lot:update", "audit:submit", "lot:export"]
}

# Policy gate for critical operations
decision := "policy_gate" if {
	input.action in ["lot:delete", "certificate:revoke", "trace:correct"]
}

# Emergency override — always allow
decision := "allow" if {
	input.action == "lot:emergency_flag"
}
