package workflow

import (
	"strings"
	"testing"
)

func TestListSorted(t *testing.T) {
	workflows := List()
	if len(workflows) != 4 {
		t.Fatalf("expected 4 workflows, got %d", len(workflows))
	}

	ids := make([]string, 0, len(workflows))
	for _, workflow := range workflows {
		ids = append(ids, workflow.ID)
	}

	expected := []string{"architecture-check", "bugfix-tdd", "pre-pr", "review-sunat"}
	for i, want := range expected {
		if ids[i] != want {
			t.Fatalf("workflow[%d] = %q, want %q", i, ids[i], want)
		}
	}
}

func TestResolve(t *testing.T) {
	tests := []struct {
		name    string
		id      string
		wantErr bool
	}{
		{name: "known", id: "review-sunat", wantErr: false},
		{name: "unknown", id: "missing", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			workflow, err := Resolve(tt.id)
			if tt.wantErr {
				if err == nil {
					t.Fatal("expected error")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if workflow.ID != tt.id {
				t.Fatalf("workflow ID = %q, want %q", workflow.ID, tt.id)
			}
			if workflow.Description == "" || workflow.RootAgentID == "" || workflow.Template == "" {
				t.Fatalf("workflow is incomplete: %#v", workflow)
			}
		})
	}
}

func TestRenderPrompt(t *testing.T) {
	workflow := Template{ID: "test", Template: "Start {{CONTEXT}} End"}

	tests := []struct {
		name     string
		context  string
		contains string
	}{
		{name: "uses context", context: "apps/api", contains: "Start apps/api End"},
		{name: "uses fallback", context: "   ", contains: "No additional context provided"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := RenderPrompt(workflow, tt.context)
			if strings.Contains(got, "{{CONTEXT}}") {
				t.Fatalf("placeholder was not replaced: %q", got)
			}
			if !strings.Contains(got, tt.contains) {
				t.Fatalf("prompt = %q, want to contain %q", got, tt.contains)
			}
		})
	}
}
