package app

import "testing"

func TestContextPanelWidth(t *testing.T) {
	tests := []struct {
		width int
		want  int
	}{
		{80, 0},   // below threshold → no panel
		{99, 0},   // threshold-1 → no panel
		{100, 40}, // threshold → 40% of 100
		{120, 48}, // 40% of 120
		{160, 60}, // 40% of 160 (capped at 60)
		{200, 60}, // 40% of 200 (capped at 60)
	}
	for _, tt := range tests {
		got := contextPanelWidth(tt.width)
		if got != tt.want {
			t.Errorf("contextPanelWidth(%d) = %d; want %d", tt.width, got, tt.want)
		}
	}
}

func TestBodySizeWithPanel(t *testing.T) {
	w, h := bodySize(120, 40, screenMenu)
	if w < 40 || h < 8 {
		t.Errorf("bodySize(120,40,screenMenu) = (%d,%d); expected >= (40,8)", w, h)
	}
}
