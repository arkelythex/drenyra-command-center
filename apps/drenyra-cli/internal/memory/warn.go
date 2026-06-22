package memory

const CapacityWarnPct = 80

// NeedsConsolidation is true when Hermes recommends merging entries before adding more.
func (s Snapshot) NeedsConsolidation() bool {
	return s.MemoryPct() >= CapacityWarnPct || s.UserPct() >= CapacityWarnPct
}

// pct is shared with store.
func pct(used, max int) float64 {
	if max <= 0 {
		return 0
	}
	return float64(used) / float64(max) * 100
}
