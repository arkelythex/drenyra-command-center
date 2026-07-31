package harness

import (
	"os"
	"path/filepath"
	"testing"
)

func TestVerifySignedReceiptLocally(t *testing.T) {
	path := filepath.Join(findFixturesRoot(t), "receipts", "receipt-signed-valid.v1.json")
	data, err := os.ReadFile(path)
	if err != nil {
		t.Skipf("signed receipt fixture not found: %v", err)
	}

	receipt, err := ParseSignedReceipt(data)
	if err != nil {
		t.Fatalf("ParseSignedReceipt: %v", err)
	}

	if receipt.SignerKeyID != "key_test_001" {
		t.Errorf("key id = %q, want key_test_001", receipt.SignerKeyID)
	}
	if receipt.ProtocolVersion != "1.0" {
		t.Errorf("protocol version = %q, want 1.0", receipt.ProtocolVersion)
	}

	result, err := VerifySignedReceiptLocally(receipt)
	if err != nil {
		t.Fatalf("VerifySignedReceiptLocally: %v", err)
	}
	if !result.Valid {
		t.Errorf("expected valid signed receipt, got: hash=%v sig=%v",
			result.HashValid, result.SignatureValid)
	}
	if !result.HashValid {
		t.Errorf("hash should be valid")
	}
	if !result.SignatureValid {
		t.Errorf("signature should be valid")
	}
}

func TestVerifySignedReceiptTampered(t *testing.T) {
	path := filepath.Join(findFixturesRoot(t), "receipts", "receipt-signed-valid.v1.json")
	data, err := os.ReadFile(path)
	if err != nil {
		t.Skipf("signed receipt fixture not found: %v", err)
	}

	receipt, err := ParseSignedReceipt(data)
	if err != nil {
		t.Fatalf("ParseSignedReceipt: %v", err)
	}

	// Tamper with the content
	receipt.Content.EvidenceHash = "TAMPERED"
	result, err := VerifySignedReceiptLocally(receipt)
	if err != nil {
		t.Fatalf("VerifySignedReceiptLocally: %v", err)
	}
	if result.Valid {
		t.Errorf("tampered receipt should be invalid")
	}
	if result.HashValid {
		t.Errorf("tampered content should fail hash")
	}
	if result.SignatureValid {
		t.Errorf("tampered content should fail signature")
	}
}

func TestParseSignedReceiptInvalid(t *testing.T) {
	_, err := ParseSignedReceipt([]byte(`{"protocolVersion":"1.0"}`))
	if err == nil {
		t.Errorf("expected error for missing content")
	}

	_, err = ParseSignedReceipt([]byte(`not json`))
	if err == nil {
		t.Errorf("expected error for invalid JSON")
	}
}
