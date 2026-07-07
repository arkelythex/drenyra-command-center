package app

import "testing"

func TestParseSlash(t *testing.T) {
	tests := []struct {
		in   string
		want slashAction
	}{
		{"/doctor", slashDoctor},
		{"/agents", slashAgents},
		{"/models", slashModels},
		{"/?", slashHelp},
		{"/quit", slashQuit},
		{"/memory", slashMemory},
		{"/resume", slashResume},
		{"/clear", slashClear},
		{"conciliar SUNAT", slashNone},
		{"", slashNone},
	}
	for _, tt := range tests {
		got, _ := parseSlash(tt.in)
		if got != tt.want {
			t.Errorf("parseSlash(%q) = %v, want %v", tt.in, got, tt.want)
		}
	}
}
