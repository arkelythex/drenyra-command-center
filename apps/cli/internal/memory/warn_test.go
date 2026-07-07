package memory

import "testing"

func TestNeedsConsolidation(t *testing.T) {
	s := Snapshot{MemoryUsed: 2000, UserUsed: 100, MemoryLimit: 2200, UserLimit: 1375}
	if !s.NeedsConsolidation() {
		t.Fatal("expected warn at 2000/2200")
	}
	s2 := Snapshot{MemoryUsed: 100, UserUsed: 100}
	if s2.NeedsConsolidation() {
		t.Fatal("expected no warn")
	}
}
