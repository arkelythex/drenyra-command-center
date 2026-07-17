package reconcile

import "testing"

func TestReconcile_WithMatchesAndTolerance(t *testing.T) {
	request := Request{
		SourceA: []Entry{
			{Reference: "F001-1", AmountCents: 10000},
			{Reference: "F001-2", AmountCents: 20000},
		},
		SourceB: []Entry{
			{Reference: "F001-1", AmountCents: 10005},
			{Reference: "F001-2", AmountCents: 23000},
		},
		ToleranceCents: 10,
	}

	result := Reconcile(request)

	if result.Matched != 1 {
		t.Fatalf("expected 1 match, got %d", result.Matched)
	}
	if len(result.AmountMismatches) != 1 {
		t.Fatalf("expected 1 mismatch, got %d", len(result.AmountMismatches))
	}
}

func TestReconcile_WithMissingReferences(t *testing.T) {
	request := Request{
		SourceA: []Entry{
			{Reference: "F001-1", AmountCents: 10000},
		},
		SourceB: []Entry{
			{Reference: "F001-2", AmountCents: 10000},
		},
	}

	result := Reconcile(request)

	if len(result.MissingInSourceA) != 1 {
		t.Fatalf("expected 1 missing in source A, got %d", len(result.MissingInSourceA))
	}
	if len(result.MissingInSourceB) != 1 {
		t.Fatalf("expected 1 missing in source B, got %d", len(result.MissingInSourceB))
	}
	if result.TotalDiscrepancies != 2 {
		t.Fatalf("expected 2 discrepancies, got %d", result.TotalDiscrepancies)
	}
}
