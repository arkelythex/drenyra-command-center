"""Canonical receipt conformance suite — REQ-HARNESS-003 (design §5.3, tasks T12/T13).

Consumes the immutable canonical vector suite at
``contracts/receipt-schema/v1/fixtures/conformance-vectors.v1.json`` and asserts,
for every vector, the recomputed content hash, the Ed25519 signature verdict,
and the §2.6 local-equivalence mapping shared with the TS and Go surfaces.

Missing or unreadable canonical fixtures are a hard failure, never a skip
(design §7): the suite is loaded at import time so the harness cannot pass
vacuously without the shared committed vectors.
"""

import json
from pathlib import Path

import pytest

from src.conformance.receipt_canonical import (
    canonical_bytes,
    receipt_sha256,
    verify_ed25519_signature,
)

REPO_ROOT = Path(__file__).resolve().parents[4]
VECTOR_PATH = (
    REPO_ROOT
    / "contracts"
    / "receipt-schema"
    / "v1"
    / "fixtures"
    / "conformance-vectors.v1.json"
)

# §2.6 statuses that a local-only surface reports as a full pass: hash and
# signature both hold, so the trusted lifecycle outcomes collapse to the
# local VALID class (spec §2.6, design §5.2).
LOCALLY_VALID_STATUSES = frozenset(
    {"SIGNER_TRUSTED", "VALID", "UNKNOWN_SIGNER", "KEY_EXPIRED", "KEY_REVOKED"}
)

# Statuses that exist only in the trusted pipeline and therefore must carry
# trustedKeys in the fixture envelope (§3.1).
TRUSTED_STATUSES = frozenset(
    {"SIGNER_TRUSTED", "UNKNOWN_SIGNER", "KEY_EXPIRED", "KEY_REVOKED"}
)

with VECTOR_PATH.open(encoding="utf-8") as handle:
    _SUITE = json.load(handle)

if _SUITE["contract"] != "receipt-schema" or _SUITE["version"] != "v1":
    raise AssertionError("unexpected canonical vector suite identity")

_VECTORS = _SUITE["vectors"]

# Pinned §2.5 serialization of vector #1's content: key-sorted compact JSON,
# proposalVersion as the integer 3, no whitespace.
FROZEN_CANONICAL = (
    '{"actorId":"user_456","companyId":"cmp_123","decision":"APPROVE",'
    '"evidenceHash":"a1b2c3d4e5","missionId":"mis_123","newStatus":"APPROVED",'
    '"payloadHash":"f6e7d8c9b0","previousStatus":"AWAITING_APPROVAL",'
    '"proposalVersion":3,"timestamp":"2026-07-30T12:00:00Z"}'
)


def test_suite_identity():
    """Spec §3.2 requires exactly the eight canonical vectors in order."""
    expected_names = [
        "receipt-valid-approval",
        "receipt-valid-completion",
        "receipt-tampered-hash",
        "receipt-invalid-signature",
        "receipt-wrong-signer",
        "receipt-unknown-signer",
        "receipt-key-expired",
        "receipt-key-revoked",
    ]
    assert [vector["name"] for vector in _VECTORS] == expected_names


def test_canonical_serialization_is_frozen():
    """The Python canonical bytes match the TS/Go sortedStringify output byte-for-byte."""
    assert (
        canonical_bytes(_VECTORS[0]["receipt"]["content"])
        == FROZEN_CANONICAL.encode("utf-8")
    )


@pytest.mark.parametrize("vector", _VECTORS, ids=lambda v: v["name"])
def test_content_hash_matches_vector(vector):
    """Recomputed SHA-256 over canonical content equals vectors.receiptHash.

    Status-branched per spec §3.1 (same rule as TS/Go): a PAYLOAD_TAMPERED
    vector carries the stale pre-tamper hash, so its recomputed hash MUST
    differ; every other vector must recompute to the expected hash exactly.
    """
    expected = vector["vectors"]["receiptHash"]
    computed = receipt_sha256(vector["receipt"]["content"])
    if vector["vectors"]["status"] == "PAYLOAD_TAMPERED":
        assert computed != expected, "tampered content recomputed to the stale hash"
    else:
        assert computed == expected
    # Self-consistency: the embedded receiptHash equals the expected one.
    assert vector["receipt"]["receiptHash"] == expected


@pytest.mark.parametrize("vector", _VECTORS, ids=lambda v: v["name"])
def test_signature_verification_matches_vector(vector):
    """Ed25519 verification over the canonical payload matches vectors.signatureValid."""
    receipt = vector["receipt"]
    sig_valid = verify_ed25519_signature(
        receipt["content"],
        receipt["signature"],
        receipt["signerPublicKey"],
    )
    assert sig_valid is vector["vectors"]["signatureValid"]


@pytest.mark.parametrize("vector", _VECTORS, ids=lambda v: v["name"])
def test_local_status_mapping(vector):
    """§2.6 local-equivalence mapping applied to every vector (mirrors Go)."""
    receipt = vector["receipt"]
    status = vector["vectors"]["status"]
    hash_valid = receipt_sha256(receipt["content"]) == receipt["receiptHash"]
    sig_valid = verify_ed25519_signature(
        receipt["content"],
        receipt["signature"],
        receipt["signerPublicKey"],
    )
    if status in LOCALLY_VALID_STATUSES:
        assert hash_valid and sig_valid, f"{status} must map to a full local pass"
    elif status == "CONTENT_VALID":
        assert hash_valid and not sig_valid, (
            "CONTENT_VALID must map to hash-valid with a broken signature"
        )
    elif status == "PAYLOAD_TAMPERED":
        assert not hash_valid, "PAYLOAD_TAMPERED must map to hash-invalid"
    else:
        raise AssertionError(f"unrecognized status {status!r}")


@pytest.mark.parametrize("vector", _VECTORS, ids=lambda v: v["name"])
def test_trusted_statuses_carry_trusted_keys(vector):
    """Trusted-only statuses require trustedKeys in the envelope (§3.1)."""
    status = vector["vectors"]["status"]
    if status in TRUSTED_STATUSES:
        assert vector.get("trustedKeys"), f"{status} requires trustedKeys (§3.1)"


def _content_with_proposal_version(version):
    content = dict(_VECTORS[0]["receipt"]["content"])
    content["proposalVersion"] = version
    return content


@pytest.mark.parametrize("bad_version", [7 / 2, "3", True])
def test_reject_non_integer_proposal_version(bad_version):
    """Python's serializer would render a non-integer in decimal form,
    diverging from the authoritative TS surface — the helper must reject
    non-integers."""
    with pytest.raises(TypeError, match="proposalVersion"):
        receipt_sha256(_content_with_proposal_version(bad_version))
