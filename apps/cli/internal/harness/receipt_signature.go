package harness

import (
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"time"
)

// SignedReceipt is the portable, self-verifying receipt artifact.
// Matches the @drenyra/mission-domain SignedReceipt type.
type SignedReceipt struct {
	ProtocolVersion string          `json:"protocolVersion"`
	Content         *ReceiptContent `json:"content"`
	ReceiptHash     string          `json:"receiptHash"`
	SignerKeyID     string          `json:"signerKeyId"`
	SignerPublicKey string          `json:"signerPublicKey"`
	Signature       string          `json:"signature"`
	IssuedAt        string          `json:"issuedAt"`
}

// SignedReceiptVerification holds the full verification result.
type SignedReceiptVerification struct {
	Valid           bool   `json:"valid"`
	HashValid       bool   `json:"hashValid"`
	SignatureValid  bool   `json:"signatureValid"`
	KeyID           string `json:"keyId"`
	ProtocolVersion string `json:"protocolVersion"`
}

// VerifySignedReceiptLocally verifies a complete signed receipt:
// 1. SHA-256 content hash integrity
// 2. Ed25519 signature authenticity
// Runs entirely offline.
func VerifySignedReceiptLocally(receipt *SignedReceipt) (*SignedReceiptVerification, error) {
	hashValid := false
	signatureValid := false

	// 1. Verify content hash
	if receipt.Content != nil && receipt.ReceiptHash != "" {
		hashResult, err := VerifyReceiptLocally(receipt.Content, receipt.ReceiptHash)
		if err != nil {
			return nil, err
		}
		hashValid = hashResult.Valid
	}

	// 2. Verify Ed25519 signature over canonical payload
	if receipt.Content != nil && receipt.Signature != "" && receipt.SignerPublicKey != "" {
		signatureValid = VerifyEd25519Signature(receipt.Content, receipt.Signature, receipt.SignerPublicKey)
	}

	return &SignedReceiptVerification{
		Valid:           hashValid && signatureValid,
		HashValid:       hashValid,
		SignatureValid:  signatureValid,
		KeyID:           receipt.SignerKeyID,
		ProtocolVersion: receipt.ProtocolVersion,
	}, nil
}

// VerifyEd25519Signature verifies an Ed25519 signature over the
// canonical payload of a receipt content.
// The public key is base64-encoded DER (SPKI).
// The signature is base64-encoded raw Ed25519 (64 bytes).
func VerifyEd25519Signature(content *ReceiptContent, signatureB64, publicKeyB64 string) bool {
	// Decode public key (DER SPKI)
	pubKeyDer, err := base64.StdEncoding.DecodeString(publicKeyB64)
	if err != nil {
		return false
	}

	// The receipt public key is exported as DER-encoded SPKI.
	// Ed25519 keys are exactly 32 bytes in their raw form.
	// We need to parse the DER SPKI to extract the raw key.
	pubKey, err := parseSPKIEd25519(pubKeyDer)
	if err != nil {
		return false
	}

	// Decode signature
	sig, err := base64.StdEncoding.DecodeString(signatureB64)
	if err != nil {
		return false
	}

	// Canonical payload
	canonical, err := sortedStringify(content)
	if err != nil {
		return false
	}

	return ed25519.Verify(pubKey, []byte(canonical), sig)
}

// parseSPKIEd25519 extracts the raw 32-byte Ed25519 public key from DER SPKI.
// SPKI structure: SEQUENCE { SEQUENCE { OID 1.3.101.112 }, BIT STRING (32 bytes) }
func parseSPKIEd25519(der []byte) (ed25519.PublicKey, error) {
	// Minimal DER parser for SPKI with Ed25519 OID (1.3.101.112)
	if len(der) < 12 {
		return nil, errInvalidSPKI
	}
	// The last 32 bytes before the end are the raw public key
	// SPKI: 30 2a 30 05 06 03 2b 65 70 03 21 00 <32 bytes>
	// The BIT STRING content is at the end.
	// Find the BIT STRING: 0x03 tag
	for i := 0; i < len(der)-1; i++ {
		if der[i] == 0x03 && der[i+1] == 0x21 && i+2+32 <= len(der) {
			// BIT STRING length 0x21 = 33 bytes: 1 unused-bits byte + 32 key bytes
			// The key starts at i+2 (unused bits count) + 1 = i+3
			keyStart := i + 3
			if keyStart+32 <= len(der) {
				key := make([]byte, 32)
				copy(key, der[keyStart:keyStart+32])
				return ed25519.PublicKey(key), nil
			}
		}
	}
	return nil, errInvalidSPKI
}

var errInvalidSPKI = &MissionError{
	Code:       "RECEIPT_VERIFICATION",
	Message:    "invalid SPKI public key",
	StatusCode: 500,
	family:     "EXTERNAL_SYSTEM",
	retryable:  false,
}

// ParseSignedReceipt parses a signed receipt from JSON bytes.
func ParseSignedReceipt(data []byte) (*SignedReceipt, error) {
	var receipt SignedReceipt
	if err := json.Unmarshal(data, &receipt); err != nil {
		return nil, err
	}
	if receipt.Content == nil {
		return nil, &MissionError{
			Code:       "RECEIPT_VERIFICATION",
			Message:    "missing content",
			StatusCode: 500,
			family:     "EXTERNAL_SYSTEM",
			retryable:  false,
		}
	}
	return &receipt, nil
}

// ReceiptIssuedAt parses the issuedAt timestamp for display.
func (r *SignedReceipt) IssuedAtTime() (time.Time, error) {
	return time.Parse(time.RFC3339, r.IssuedAt)
}
