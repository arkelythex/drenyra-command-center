package app

import (
	"strings"
	"testing"
)

func TestAgentModeToggle(t *testing.T) {
	if got := agentModeBuild.Toggle(); got != agentModePlan {
		t.Fatalf("Build.Toggle() = %q, want %q", got, agentModePlan)
	}
	if got := agentModePlan.Toggle(); got != agentModeBuild {
		t.Fatalf("Plan.Toggle() = %q, want %q", got, agentModeBuild)
	}
}

func TestAgentModeFromConfig(t *testing.T) {
	if got := agentModeFromConfig("plan"); got != agentModePlan {
		t.Fatalf("agentModeFromConfig(plan) = %q, want %q", got, agentModePlan)
	}
	if got := agentModeFromConfig("unknown"); got != agentModeBuild {
		t.Fatalf("agentModeFromConfig(unknown) = %q, want %q", got, agentModeBuild)
	}
}

func TestTaskForMode(t *testing.T) {
	const task = "review SUNAT flow"

	if got := taskForMode(task, agentModeBuild); got != task {
		t.Fatalf("build task = %q, want %q", got, task)
	}

	got := taskForMode(task, agentModePlan)
	if !strings.Contains(got, "PLAN MODE") || !strings.Contains(got, task) {
		t.Fatalf("plan task = %q, want plan guard and original task", got)
	}
	if !strings.Contains(got, "do not apply code or data changes") {
		t.Fatalf("plan task = %q, want read-only guard", got)
	}
}
