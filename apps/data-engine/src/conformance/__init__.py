"""Canonical receipt conformance helpers (design D4, tasks T13).

Exposes the frozen §2.5 canonicalization and Ed25519 verification surface used
by the Python conformance harness. Pure helpers with no repository-path
knowledge: they accept parsed mappings and return bytes/strings/bools.
"""

from src.conformance.receipt_canonical import (
    canonical_bytes,
    receipt_sha256,
    verify_ed25519_signature,
)

__all__ = ["canonical_bytes", "receipt_sha256", "verify_ed25519_signature"]
