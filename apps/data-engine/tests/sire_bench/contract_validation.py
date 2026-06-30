"""Validate SireProcessor output against sire-analyze.json contract subset."""

from __future__ import annotations

from typing import Any


def processor_to_contract_view(result: dict[str, Any]) -> dict[str, Any]:
    """Map internal processor shape to Data Engine SIRE Analyze Response v1."""
    status = result.get("status")
    if status not in ("success", "error"):
        raise ValueError(f"Invalid status for contract: {status!r}")

    if status == "error":
        return {"status": "error"}

    summary = result.get("summary") or {}
    total_amount = summary.get("total_purchases")
    if total_amount is None:
        total_amount = summary.get("total_sales")

    contract_view: dict[str, Any] = {
        "status": "success",
        "recordCount": result.get("processed_rows"),
        "totalAmount": total_amount,
        "totalIGV": summary.get("total_igv"),
    }

    warnings: list[dict[str, Any]] = []
    for issue in result.get("validation_issues") or []:
        warnings.append(
            {
                "line": 0,
                "field": issue.get("type", "unknown"),
                "message": issue.get("message", ""),
            }
        )
    if warnings:
        contract_view["warnings"] = warnings

    return contract_view


def assert_contract_compatible(result: dict[str, Any]) -> None:
    """Assert processor output maps to valid sire-analyze contract fields."""
    view = processor_to_contract_view(result)

    assert view["status"] in ("success", "error")

    if view["status"] == "success":
        assert isinstance(view.get("recordCount"), int)
        assert view["recordCount"] >= 0
        assert isinstance(view.get("totalIGV"), (int, float))
        if view.get("totalAmount") is not None:
            assert isinstance(view["totalAmount"], (int, float))

        for warning in view.get("warnings") or []:
            assert "field" in warning
            assert "message" in warning
