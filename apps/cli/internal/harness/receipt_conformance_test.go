package harness

import (
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

// conformanceEnvelope models the §3.1 vector-suite envelope from
// contracts/receipt-schema/v1/fixtures/conformance-vectors.v1.json.
type conformanceEnvelope struct {
	Contract string              `json:"contract"`
	Version  string              `json:"version"`
	Vectors  []conformanceVector `json:"vectors"`
}

type conformanceVector struct {
	Name        string             `json:"name"`
	Description string             `json:"description"`
	Receipt     json.RawMessage    `json:"receipt"`
	TrustedKeys []json.RawMessage  `json:"trustedKeys"`
	Expected    conformanceOutcome `json:"vectors"`
}

// conformanceOutcome carries the expected local surface: the recomputed
// content hash, the Ed25519 signature verdict, and the §2.6 status.
type conformanceOutcome struct {
	ReceiptHash    string `json:"receiptHash"`
	SignatureValid bool   `json:"signatureValid"`
	Status         string `json:"status"`
}

// TestReceiptConformanceVectors consumes the immutable canonical vector suite
// (REQ-HARNESS-002): every vector parses through ParseSignedReceipt,
// round-trips the bundle metadata fields, and matches the expected local
// surface — recomputed content hash, signature validity, and the §2.6
// local-equivalence mapping. Go is a local-only surface: trusted statuses
// assert Valid == true and the fixture must carry trustedKeys for them.
func TestReceiptConformanceVectors(t *testing.T) {
	path := conformanceVectorsPath(t)
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read conformance vectors: %v", err)
	}

	var suite conformanceEnvelope
	if err := json.Unmarshal(data, &suite); err != nil {
		t.Fatalf("parse conformance vectors: %v", err)
	}
	if len(suite.Vectors) == 0 {
		t.Fatal("conformance: vector suite is empty")
	}
	if suite.Contract != "receipt-schema" || suite.Version != "v1" {
		t.Fatalf("unexpected suite identity: contract=%q version=%q", suite.Contract, suite.Version)
	}

	for _, vector := range suite.Vectors {
		t.Run(vector.Name, func(t *testing.T) {
			receipt, err := ParseSignedReceipt(vector.Receipt)
			if err != nil {
				t.Fatalf("ParseSignedReceipt: %v", err)
			}

			// Round-trip: bundle metadata survives the Go struct (design D5).
			if receipt.ReceiptType == "" {
				t.Error("receiptType did not round-trip")
			}
			if receipt.Algorithm == "" {
				t.Error("algorithm did not round-trip")
			}
			if receipt.Algorithm != "Ed25519" {
				t.Errorf("algorithm = %q, want Ed25519", receipt.Algorithm)
			}

			// Self-consistency: the embedded receiptHash equals the expected one;
			// for PAYLOAD_TAMPERED that embedded hash is the stale pre-tamper hash.
			if receipt.ReceiptHash != vector.Expected.ReceiptHash {
				t.Errorf("embedded receiptHash = %q, want %q", receipt.ReceiptHash, vector.Expected.ReceiptHash)
			}

			// Content-hash surface, status-branched per spec §3.1: a tampered
			// content must NOT recompute to the stale expected hash.
			hashResult, err := VerifyReceiptLocally(receipt.Content, vector.Expected.ReceiptHash)
			if err != nil {
				t.Fatalf("VerifyReceiptLocally: %v", err)
			}
			if vector.Expected.Status == "PAYLOAD_TAMPERED" {
				if hashResult.Valid {
					t.Errorf("tampered content recomputed to the stale expected hash")
				}
			} else if !hashResult.Valid {
				t.Errorf("content hash mismatch:\ncomputed: %s\nexpected: %s",
					hashResult.ComputedHash, vector.Expected.ReceiptHash)
			}

			// Full local surface: signature verdict + overall validity.
			result, err := VerifySignedReceiptLocally(receipt)
			if err != nil {
				t.Fatalf("VerifySignedReceiptLocally: %v", err)
			}
			if result.SignatureValid != vector.Expected.SignatureValid {
				t.Errorf("signatureValid = %v, want %v", result.SignatureValid, vector.Expected.SignatureValid)
			}

			// §2.6 local-equivalence mapping.
			assertLocalMapping(t, vector.Expected.Status, result)

			// Fixture integrity: trusted-only statuses require trustedKeys (§3.1).
			if isTrustedStatus(vector.Expected.Status) && len(vector.TrustedKeys) == 0 {
				t.Errorf("status %s requires trustedKeys, none present", vector.Expected.Status)
			}
		})
	}
}

// assertLocalMapping applies the §2.6 local-equivalence mapping: trusted
// statuses map to Valid=true; CONTENT_VALID maps to hash-valid with a broken
// signature; PAYLOAD_TAMPERED maps to hash-invalid and overall invalid.
func assertLocalMapping(t *testing.T, status string, result *SignedReceiptVerification) {
	t.Helper()
	switch status {
	case "SIGNER_TRUSTED", "VALID", "UNKNOWN_SIGNER", "KEY_EXPIRED", "KEY_REVOKED":
		if !result.Valid {
			t.Errorf("status %s must map to valid=true, got hash=%v sig=%v",
				status, result.HashValid, result.SignatureValid)
		}
	case "CONTENT_VALID":
		if result.Valid || !result.HashValid || result.SignatureValid {
			t.Errorf("status CONTENT_VALID must map to valid=false hashValid=true signatureValid=false, got valid=%v hash=%v sig=%v",
				result.Valid, result.HashValid, result.SignatureValid)
		}
	case "PAYLOAD_TAMPERED":
		if result.Valid || result.HashValid {
			t.Errorf("status PAYLOAD_TAMPERED must map to valid=false hashValid=false, got valid=%v hash=%v",
				result.Valid, result.HashValid)
		}
	default:
		t.Errorf("unrecognized status %q", status)
	}
}

// isTrustedStatus reports whether a status belongs to the trusted pipeline
// (design §5.2: trusted lifecycle statuses are out of scope for Go but must
// still map to local Valid=true and be backed by trustedKeys in the suite).
func isTrustedStatus(status string) bool {
	switch status {
	case "SIGNER_TRUSTED", "UNKNOWN_SIGNER", "KEY_EXPIRED", "KEY_REVOKED":
		return true
	default:
		return false
	}
}

// conformanceVectorsPath resolves the canonical vector file by walking up from
// this source file until the file exists (design D5). Absence is a hard test
// failure — conformance fixtures can never be skipped (spec §7).
func conformanceVectorsPath(t *testing.T) string {
	t.Helper()
	_, callerFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("conformance: unable to resolve caller path")
	}
	dir := filepath.Dir(callerFile)
	for {
		candidate := filepath.Join(dir, "contracts", "receipt-schema", "v1", "fixtures", "conformance-vectors.v1.json")
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			return candidate
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	t.Fatalf("conformance: canonical vector file not found above %s", callerFile)
	return ""
}
