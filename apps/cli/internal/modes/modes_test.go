package modes

import (
	"strings"
	"testing"
)

func TestNormalize(t *testing.T) {
	if Normalize(" PLAN ") != Plan {
		t.Fatal("Normalize should accept plan case-insensitively")
	}
	if Normalize("unknown") != Build {
		t.Fatal("Normalize should default to build")
	}
}

func TestModeToggleAndLabel(t *testing.T) {
	if Plan.Toggle() != Build || Build.Toggle() != Plan {
		t.Fatalf("Toggle() failed")
	}
	if Plan.Label() != "Plan" || Build.Label() != "Build" {
		t.Fatalf("Label() failed")
	}
}

func TestApplyToTask(t *testing.T) {
	buildTask, buildPolicy := ApplyToTask("ship it", Build)
	if buildTask != "ship it" || buildPolicy.ReadOnly {
		t.Fatalf("Build ApplyToTask() = %q %#v", buildTask, buildPolicy)
	}
	planTask, planPolicy := ApplyToTask("ship it", Plan)
	if !planPolicy.ReadOnly || !strings.Contains(planTask, "PLAN MODE (read-only)") || !strings.Contains(planTask, "ship it") {
		t.Fatalf("Plan ApplyToTask() = %q %#v", planTask, planPolicy)
	}
}
