package harness

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
)

// ReceiptContent represents the data that goes into a receipt hash.
// Fields without omitempty are always included in canonical JSON.
// Matches the @drenyra/mission-protocol ReceiptContent type.
type ReceiptContent struct {
	MissionID       string `json:"missionId"`
	CompanyID       string `json:"companyId,omitempty"`
	ActorID         string `json:"actorId,omitempty"`
	Decision        string `json:"decision,omitempty"`
	ProposalVersion int    `json:"proposalVersion,omitempty"`
	EvidenceHash    string `json:"evidenceHash,omitempty"`
	PreviousStatus  string `json:"previousStatus,omitempty"`
	NewStatus       string `json:"newStatus,omitempty"`
	PayloadHash     string `json:"payloadHash,omitempty"`
	Timestamp       string `json:"timestamp"`
}

// EvidenceItem matches the protocol EvidenceItem type.
// Already defined in types.go — do not redeclare.

// OfflineReceiptVerification holds the result of a local receipt check.
type OfflineReceiptVerification struct {
	ComputedHash  string `json:"computedHash"`
	AssertedHash  string `json:"assertedHash"`
	Valid         bool   `json:"valid"`
	CanonicalJSON string `json:"canonicalJson,omitempty"`
}

// sortedStringify serializes a struct with keys sorted alphabetically.
// Uses omitempty-aware JSON tags so empty fields are excluded.
func sortedStringify(v interface{}) (string, error) {
	data, err := json.Marshal(v)
	if err != nil {
		return "", err
	}
	var raw map[string]interface{}
	if err := json.Unmarshal(data, &raw); err != nil {
		return "", err
	}
	return string(sortedMarshal(raw)), nil
}

// sortedMarshal marshals a map with sorted keys for deterministic output.
func sortedMarshal(m map[string]interface{}) []byte {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var buf strings.Builder
	buf.WriteByte('{')
	for i, k := range keys {
		if i > 0 {
			buf.WriteByte(',')
		}
		buf.WriteByte('"')
		buf.WriteString(k)
		buf.WriteString(`":`)
		writeJSONValue(&buf, m[k])
	}
	buf.WriteByte('}')
	return []byte(buf.String())
}

func writeJSONValue(buf *strings.Builder, v interface{}) {
	switch val := v.(type) {
	case string:
		buf.WriteByte('"')
		// Escape backslashes and quotes
		escaped := strings.ReplaceAll(val, "\\", "\\\\")
		escaped = strings.ReplaceAll(escaped, "\"", "\\\"")
		buf.WriteString(escaped)
		buf.WriteByte('"')
	case float64:
		if val == float64(int64(val)) {
			fmt.Fprintf(buf, "%d", int64(val))
		} else {
			fmt.Fprintf(buf, "%g", val)
		}
	case bool:
		fmt.Fprintf(buf, "%t", val)
	case nil:
		buf.WriteString("null")
	default:
		b, _ := json.Marshal(val)
		buf.Write(b)
	}
}

// VerifyReceiptLocally recomputes the receipt hash from content
// and compares it against the asserted hash.
// This runs entirely offline without server interaction.
func VerifyReceiptLocally(content *ReceiptContent, assertedHash string) (*OfflineReceiptVerification, error) {
	canonical, err := sortedStringify(content)
	if err != nil {
		return nil, fmt.Errorf("canonical serialization: %w", err)
	}

	hash := sha256.Sum256([]byte(canonical))
	computed := fmt.Sprintf("%x", hash)

	return &OfflineReceiptVerification{
		ComputedHash:  computed,
		AssertedHash:  assertedHash,
		Valid:         assertedHash != "" && computed == assertedHash,
		CanonicalJSON: canonical,
	}, nil
}

// ComputeEvidenceHash computes the SHA-256 hash of an evidence array,
// sorted by ID for deterministic output.
func ComputeEvidenceHash(evidence []EvidenceItem) string {
	sorted := make([]EvidenceItem, len(evidence))
	copy(sorted, evidence)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].ID < sorted[j].ID
	})

	data, _ := json.Marshal(sorted)
	hash := sha256.Sum256(data)
	return fmt.Sprintf("%x", hash)
}
