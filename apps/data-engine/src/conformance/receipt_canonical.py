"""Canonical receipt hashing and Ed25519 verification (design §5.3, tasks T13).

Three pure helpers with no repository-path knowledge:

- ``canonical_bytes`` — the §2.5 key-sorted compact JSON serialization as
  UTF-8 bytes, byte-identical to the authoritative TS ``sortedStringify`` and
  the Go ``sortedStringify`` surfaces;
- ``receipt_sha256`` — lowercase hex SHA-256 over the canonical content bytes;
- ``verify_ed25519_signature`` — base64 Ed25519 verification over the
  canonical payload using a base64 DER SPKI public key; returns False for
  invalid base64, malformed DER, a wrong key type, or a bad signature instead
  of leaking crypto exceptions (design §7).
"""

from __future__ import annotations

import base64
import hashlib
import json
from typing import Any

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey


def canonical_bytes(content: dict[str, Any]) -> bytes:
    """Serialize a receipt content mapping to canonical UTF-8 bytes (§2.5).

    Matches the TS/Go sortedStringify semantics: object keys sorted
    alphabetically, compact JSON (no whitespace), arrays in order, and JSON
    integers serialized as integers (never in decimal form).
    """
    if not isinstance(content, dict):
        raise TypeError("receipt content must be a mapping")
    _ensure_json_integer_fields(content)
    canonical = json.dumps(
        content,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )
    return canonical.encode("utf-8")


def receipt_sha256(content: dict[str, Any]) -> str:
    """Lowercase hex SHA-256 over the canonical serialization of content."""
    return hashlib.sha256(canonical_bytes(content)).hexdigest()


def verify_ed25519_signature(
    content: dict[str, Any],
    signature_b64: str,
    public_key_b64: str,
) -> bool:
    """Verify an Ed25519 signature over the canonical payload.

    Returns False for invalid base64, malformed DER SPKI, a non-Ed25519 key,
    or a bad signature — never raises crypto exceptions (design §7). The
    broad boundary mirrors the authoritative TS surface, which also collapses
    every verification error to False.
    """
    try:
        signature = base64.b64decode(signature_b64, validate=True)
        public_der = base64.b64decode(public_key_b64, validate=True)
        public_key = serialization.load_der_public_key(public_der)
    except Exception:
        return False
    if not isinstance(public_key, Ed25519PublicKey):
        return False
    try:
        public_key.verify(signature, canonical_bytes(content))
    except Exception:
        return False
    return True


def _ensure_json_integer_fields(content: dict[str, Any]) -> None:
    """Guarantee proposalVersion serializes as a JSON integer.

    Python's serializer would render a non-integer in decimal form while the
    authoritative TS surface renders the same schema field as an integer —
    parity requires a real int (design §5.3: tests reject a non-integer
    proposalVersion). Python bool is an int subclass, so it is rejected too.
    """
    version = content.get("proposalVersion")
    if version is not None and (
        not isinstance(version, int) or isinstance(version, bool)
    ):
        raise TypeError(
            "proposalVersion must be a JSON integer, got " + type(version).__name__
        )
