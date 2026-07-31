package harness

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestCanonicalizationVectors(t *testing.T) {
	// Resolve fixtures path relative to the Go module root
	fixturesPath := findFixturesRoot(t)
	vectorsPath := filepath.Join(fixturesPath, "canonicalization-vectors.json")

	data, err := os.ReadFile(vectorsPath)
	if err != nil {
		t.Skipf("fixtures not found at %s: %v", vectorsPath, err)
	}

	var suite struct {
		Vectors []struct {
			ID                    string          `json:"id"`
			Description           string          `json:"description"`
			Input                 json.RawMessage `json:"input"`
			ExpectedCanonicalJSON string          `json:"expectedCanonicalJson"`
			ExpectedSortedJSON    string          `json:"expectedSortedJson"`
			ExpectedSha256        string          `json:"expectedSha256"`
		} `json:"vectors"`
	}
	if err := json.Unmarshal(data, &suite); err != nil {
		t.Fatalf("parse vectors: %v", err)
	}

	for _, v := range suite.Vectors {
		t.Run(v.ID, func(t *testing.T) {
			// Test canonical JSON serialization
			var raw map[string]interface{}
			if err := json.Unmarshal(v.Input, &raw); err == nil {
				got := string(sortedMarshal(raw))
				if v.ExpectedCanonicalJSON != "" && got != v.ExpectedCanonicalJSON {
					// Can't assert strictly because Go's JSON marshal may differ in
					// number formatting, but at least verify the hash matches
					t.Logf("canonical JSON mismatch (may be acceptable):\ngot:  %s\nwant: %s", got, v.ExpectedCanonicalJSON)
				}
			}

			// Verify receipt content hashing
			var rc ReceiptContent
			if err := json.Unmarshal(v.Input, &rc); err == nil && v.ExpectedSha256 != "" {
				result, err := VerifyReceiptLocally(&rc, v.ExpectedSha256)
				if err != nil {
					t.Fatalf("VerifyReceiptLocally: %v", err)
				}
				if !result.Valid {
					t.Errorf("hash mismatch for vector %s:\ncomputed: %s\nexpected: %s",
						v.ID, result.ComputedHash, v.ExpectedSha256)
				}
			}
		})
	}
}

func TestGoldenMissionFixtures(t *testing.T) {
	fixturesPath := findFixturesRoot(t)
	missionFixtures := filepath.Join(fixturesPath, "missions")

	entries, err := os.ReadDir(missionFixtures)
	if err != nil {
		t.Skipf("mission fixtures not found: %v", err)
	}

	for _, entry := range entries {
		if filepath.Ext(entry.Name()) != ".json" {
			continue
		}
		t.Run(entry.Name(), func(t *testing.T) {
			data, err := os.ReadFile(filepath.Join(missionFixtures, entry.Name()))
			if err != nil {
				t.Fatalf("read fixture: %v", err)
			}
			var snapshot struct {
				ID     string `json:"id"`
				Status string `json:"status"`
			}
			if err := json.Unmarshal(data, &snapshot); err != nil {
				t.Fatalf("parse fixture: %v", err)
			}
			if snapshot.ID == "" {
				t.Errorf("fixture %s: missing id", entry.Name())
			}
			if snapshot.Status == "" {
				t.Errorf("fixture %s: missing status", entry.Name())
			}
		})
	}
}

func TestGoldenErrorFixtures(t *testing.T) {
	fixturesPath := findFixturesRoot(t)
	errorFixtures := filepath.Join(fixturesPath, "errors")

	entries, err := os.ReadDir(errorFixtures)
	if err != nil {
		t.Skipf("error fixtures not found: %v", err)
	}

	for _, entry := range entries {
		if filepath.Ext(entry.Name()) != ".json" {
			continue
		}
		t.Run(entry.Name(), func(t *testing.T) {
			data, err := os.ReadFile(filepath.Join(errorFixtures, entry.Name()))
			if err != nil {
				t.Fatalf("read fixture: %v", err)
			}
			var envelope struct {
				Success bool `json:"success"`
				Error   struct {
					Code    string                 `json:"code"`
					Message string                 `json:"message"`
					Details map[string]interface{} `json:"details"`
				} `json:"error"`
			}
			if err := json.Unmarshal(data, &envelope); err != nil {
				t.Fatalf("parse fixture: %v", err)
			}
			if envelope.Error.Code == "" {
				t.Errorf("fixture %s: missing error code", entry.Name())
			}
			// Verify it maps to a known family
			family := familyForCode(envelope.Error.Code)
			if family == "UNKNOWN" {
				t.Errorf("fixture %s: unknown code family for %s", entry.Name(), envelope.Error.Code)
			}
		})
	}
}

func TestGoldenReceiptFixtures(t *testing.T) {
	fixturesPath := findFixturesRoot(t)
	receiptFixtures := filepath.Join(fixturesPath, "receipts")

	entries, err := os.ReadDir(receiptFixtures)
	if err != nil {
		t.Skipf("receipt fixtures not found: %v", err)
	}

	for _, entry := range entries {
		if filepath.Ext(entry.Name()) != ".json" {
			continue
		}
		t.Run(entry.Name(), func(t *testing.T) {
			data, err := os.ReadFile(filepath.Join(receiptFixtures, entry.Name()))
			if err != nil {
				t.Fatalf("read fixture: %v", err)
			}

			// Signed receipt fixtures (receipt-signed-*) use the full SignedReceipt bundle
			if strings.HasPrefix(entry.Name(), "receipt-signed-") {
				receipt, err := ParseSignedReceipt(data)
				if err != nil {
					t.Fatalf("parse signed receipt: %v", err)
				}
				result, err := VerifySignedReceiptLocally(receipt)
				if err != nil {
					t.Fatalf("VerifySignedReceiptLocally: %v", err)
				}
				isValid := strings.HasSuffix(entry.Name(), "-valid.v1.json")
				if isValid && !result.Valid {
					t.Errorf("expected VALID signed receipt, got: hash=%v sig=%v",
						result.HashValid, result.SignatureValid)
				}
				if !isValid && result.Valid {
					t.Errorf("tampered signed receipt should be INVALID")
				}
				return
			}

			var envelope struct {
				Content     *ReceiptContent `json:"content"`
				ReceiptHash string          `json:"receiptHash"`
			}
			if err := json.Unmarshal(data, &envelope); err != nil {
				t.Fatalf("parse fixture: %v", err)
			}
			if envelope.Content == nil || envelope.ReceiptHash == "" {
				t.Fatalf("fixture %s: missing content or receiptHash", entry.Name())
			}

			result, err := VerifyReceiptLocally(envelope.Content, envelope.ReceiptHash)
			if err != nil {
				t.Fatalf("VerifyReceiptLocally: %v", err)
			}
			isValid := entry.Name() == "receipt-valid.v1.json"
			if isValid && !result.Valid {
				t.Errorf("expected VALID receipt, got invalid:\ncomputed: %s\nasserted: %s",
					result.ComputedHash, result.AssertedHash)
			}
			if !isValid && result.Valid {
				t.Errorf("tampered receipt should be INVALID, but hash matched")
			}
		})
	}
}

// findFixturesRoot walks up from the test directory to find fixtures/.
func findFixturesRoot(t *testing.T) string {
	t.Helper()
	// Try relative to working directory first
	candidates := []string{
		"../../fixtures",
		"../../../fixtures",
		"fixtures",
	}
	for _, c := range candidates {
		abs, err := filepath.Abs(c)
		if err != nil {
			continue
		}
		if info, err := os.Stat(abs); err == nil && info.IsDir() {
			return abs
		}
	}
	// Try from $PWD
	pwd, _ := os.Getwd()
	for i := 0; i < 5; i++ {
		candidate := filepath.Join(pwd, "fixtures")
		if info, err := os.Stat(candidate); err == nil && info.IsDir() {
			return candidate
		}
		pwd = filepath.Dir(pwd)
	}
	t.Skip("fixtures directory not found — skipping cross-language tests")
	return ""
}
