"""
SIRE-bench golden regression tests.

Loads testdata/sire-bench/ cases from manifest.json and compares
processor output against expected golden files.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from src.services.sire_processor import SireProcessor

from tests.sire_bench.contract_validation import assert_contract_compatible

BENCH_ROOT = Path(__file__).resolve().parents[2] / "testdata" / "sire-bench"
MANIFEST_PATH = BENCH_ROOT / "manifest.json"


def _load_manifest() -> list[dict[str, Any]]:
    with MANIFEST_PATH.open(encoding="utf-8") as f:
        data = json.load(f)
    return data["cases"]


def _deep_get(obj: dict[str, Any], *keys: str) -> Any:
    current: Any = obj
    for key in keys:
        if not isinstance(current, dict) or key not in current:
            return None
        current = current[key]
    return current


def _assert_subset(actual: dict[str, Any], expected: dict[str, Any], path: str = "") -> None:
    """Assert expected keys/values are present in actual (allows extra keys)."""
    for key, expected_value in expected.items():
        full_path = f"{path}.{key}" if path else key
        if key not in actual:
            raise AssertionError(f"Missing key: {full_path}")
        actual_value = actual[key]

        if isinstance(expected_value, dict):
            assert isinstance(actual_value, dict), f"{full_path} should be dict"
            _assert_subset(actual_value, expected_value, full_path)
        elif isinstance(expected_value, list):
            assert isinstance(actual_value, list), f"{full_path} should be list"
            assert len(actual_value) >= len(expected_value), (
                f"{full_path}: expected at least {len(expected_value)} items"
            )
            for i, expected_item in enumerate(expected_value):
                if isinstance(expected_item, dict):
                    _assert_subset(actual_value[i], expected_item, f"{full_path}[{i}]")
                else:
                    assert actual_value[i] == expected_item, f"{full_path}[{i}]"
        elif isinstance(expected_value, float):
            assert abs(float(actual_value) - expected_value) < 0.01, (
                f"{full_path}: {actual_value} != {expected_value}"
            )
        else:
            assert actual_value == expected_value, f"{full_path}: {actual_value} != {expected_value}"


def _run_case(case: dict[str, Any]) -> None:
    input_path = BENCH_ROOT / case["input"]
    expected_path = BENCH_ROOT / case["expected"]

    file_content = input_path.read_bytes()
    with expected_path.open(encoding="utf-8") as f:
        expected = json.load(f)

    processor = case["processor"]
    if processor == "process_sire_compras":
        actual = SireProcessor.process_sire_compras(file_content)
    elif processor == "process_sire_ventas":
        actual = SireProcessor.process_sire_ventas(file_content)
    else:
        raise ValueError(f"Unknown processor: {processor}")

    # Compare deterministic fields only (skip dynamic lists like top_providers)
    compare_keys = [
        "status",
        "processed_rows",
        "summary",
        "validation_issues",
        "by_document_type",
        "norma_aplicada",
        "version_tabla",
        "deterministic",
    ]
    for key in compare_keys:
        if key in expected:
            _assert_subset({key: actual.get(key)}, {key: expected[key]})

    assert expected.get("deterministic") is True
    assert expected.get("norma_aplicada"), "golden must include norma_aplicada"
    assert expected.get("version_tabla"), "golden must include version_tabla"
    assert_contract_compatible(actual)


@pytest.mark.sire_bench
class TestSireBenchGolden:
    """Parametrized golden regression from manifest.json."""

    @pytest.mark.parametrize(
        "case",
        _load_manifest(),
        ids=[c["id"] for c in _load_manifest()],
    )
    def test_golden_case(self, case: dict[str, Any]) -> None:
        _run_case(case)


@pytest.mark.sire_bench
def test_manifest_has_tier_a_cases() -> None:
    cases = _load_manifest()
    tier_a = [c for c in cases if c.get("tier") == "A"]
    assert len(tier_a) >= 4, "SIRE-bench requires at least 4 Tier A cases"
