# Andino — Drone Engineering Vertical Approval Policy
package arkelythex.vertical.andino

import future.keywords.if
import future.keywords.in

default decision := "gate"
default reason := "Default: requires human approval"

# === Drone-Specific Operations ===

# Mission launch — requires airspace clearance and weather check
decision := "allow" if {
	input.action == "mission:launch"
	input.risk_context.airspace_cleared == true
	input.risk_context.weather_valid == true
}
reason := "Auto-approved: launch conditions met" if {
	input.action == "mission:launch"
	input.risk_context.airspace_cleared == true
	input.risk_context.weather_valid == true
}

decision := "gate" if {
	input.action == "mission:launch"
	not allow
}
reason := "Gate: launch requires airspace clearance and valid weather" if {
	input.action == "mission:launch"
	not allow
}

# Emergency operations — always auto-approved
decision := "auto" if {
	input.action == "mission:abort"
}
reason := "Auto: mission abort" if {
	input.action == "mission:abort"
}

decision := "auto" if {
	input.action == "emergency:land"
}
reason := "Auto: emergency landing" if {
	input.action == "emergency:land"
}

# Firmware updates — require gate
decision := "gate" if {
	startswith(input.action, "firmware:")
}
reason := "Gate: firmware update requires approval" if {
	startswith(input.action, "firmware:")
}

# Telemetry reads — auto
decision := "auto" if {
	startswith(input.action, "telemetry:")
}
reason := "Auto: telemetry read" if {
	startswith(input.action, "telemetry:")
}

# Morphology evolution — requires review (compute cost)
decision := "gate" if {
	input.action == "morphology:evolve"
}
reason := "Gate: morphology evolution requires review" if {
	input.action == "morphology:evolve"
}

# Simulation operations — auto
decision := "auto" if {
	startswith(input.action, "simulation:")
}
reason := "Auto: simulation operation" if {
	startswith(input.action, "simulation:")
}

# Pipeline phase transitions — auto except fly/physical
decision := "auto" if {
	startswith(input.action, "pipeline:")
	not input.action == "pipeline:fly"
}
reason := "Auto: pipeline phase transition" if {
	startswith(input.action, "pipeline:")
	not input.action == "pipeline:fly"
}

decision := "gate" if {
	input.action == "pipeline:fly"
}
reason := "Gate: physical flight requires approval" if {
	input.action == "pipeline:fly"
}
