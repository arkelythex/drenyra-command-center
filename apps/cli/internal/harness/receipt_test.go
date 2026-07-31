package harness

import (
	"crypto/sha256"
	"fmt"
	"testing"
)

func TestVerifyReceiptLocally(t *testing.T) {
	content := &ReceiptContent{
		MissionID:       "mis_123",
		CompanyID:       "cmp_123",
		ActorID:         "user_456",
		Decision:        "APPROVE",
		ProposalVersion: 3,
		EvidenceHash:    "abc123",
		PreviousStatus:  "AWAITING_APPROVAL",
		NewStatus:       "APPROVED",
		PayloadHash:     "def456",
		Timestamp:       "2026-07-30T12:00:00Z",
	}

	// Compute the expected SHA-256 hash
	canonical, err := sortedStringify(content)
	if err != nil {
		t.Fatalf("sortedStringify: %v", err)
	}
	hash := sha256.Sum256([]byte(canonical))
	expectedHash := fmt.Sprintf("%x", hash)

	// First pass: verify with correct hash
	result, err := VerifyReceiptLocally(content, expectedHash)
	if err != nil {
		t.Fatalf("VerifyReceiptLocally: %v", err)
	}
	if !result.Valid {
		t.Errorf("expected valid receipt, got invalid")
	}
	if result.ComputedHash != result.AssertedHash {
		t.Errorf("hash mismatch: %s != %s", result.ComputedHash, result.AssertedHash)
	}

	// Second pass: verify with wrong hash
	result, err = VerifyReceiptLocally(content, "wronghash")
	if err != nil {
		t.Fatalf("VerifyReceiptLocally: %v", err)
	}
	if result.Valid {
		t.Errorf("expected invalid receipt with wrong hash")
	}
}

func TestVerifyReceiptLocallyEmpty(t *testing.T) {
	content := &ReceiptContent{
		MissionID: "mis_empty",
		Timestamp: "2026-01-01T00:00:00Z",
	}

	result, err := VerifyReceiptLocally(content, "")
	if err != nil {
		t.Fatalf("VerifyReceiptLocally: %v", err)
	}
	if result.Valid {
		t.Errorf("expected invalid for empty hash")
	}
}

func TestComputeEvidenceHash(t *testing.T) {
	evidence := []EvidenceItem{
		{ID: "ev_3", Label: "Bank statement", Type: "document"},
		{ID: "ev_1", Label: "Invoice", Type: "document"},
		{ID: "ev_2", Label: "Receipt", Type: "document"},
	}

	hash := ComputeEvidenceHash(evidence)
	if hash == "" {
		t.Errorf("expected non-empty hash")
	}

	// Must be deterministic regardless of input order
	hash2 := ComputeEvidenceHash([]EvidenceItem{
		{ID: "ev_1", Label: "Invoice", Type: "document"},
		{ID: "ev_2", Label: "Receipt", Type: "document"},
		{ID: "ev_3", Label: "Bank statement", Type: "document"},
	})
	if hash != hash2 {
		t.Errorf("evidence hash not deterministic: %s != %s", hash, hash2)
	}
}

func TestSortedStringify(t *testing.T) {
	content := &ReceiptContent{
		MissionID: "mis_1",
		ActorID:   "user_1",
	}
	result, err := sortedStringify(content)
	if err != nil {
		t.Fatalf("sortedStringify: %v", err)
	}
	if result == "" {
		t.Errorf("expected non-empty JSON")
	}
}
