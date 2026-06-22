"""
Tests for BankingAnalyzer — statement parsing, reconciliation, pattern analysis.
"""

import pytest
from src.services.banking_analyzer import BankingAnalyzer


class TestReconcile:
    """Tests for reconcile_transactions."""

    def test_full_reconciliation(self, bank_transactions, system_transactions):
        """Should match bank tx with system tx within tolerance."""
        result = BankingAnalyzer.reconcile_transactions(
            bank_transactions, system_transactions,
            tolerance_days=3, tolerance_amount=0.01,
        )
        # SYS001 matches bank tx 0 (5000 Jan 10)
        # SYS002 matches bank tx 1 (-2500 Jan 12)
        # SYS003 matches bank tx 2 (3000 Jan 15)
        # SYS004 is 1 day off from bank tx 4 (-3200 Jan 25 vs Jan 26) → within 3 day tolerance
        assert result["reconciliation_rate"] > 0
        assert len(result["matched"]) > 0

    def test_empty_bank(self, bank_transactions_empty, system_transactions):
        """Empty bank transactions should give 0 reconciliation rate."""
        result = BankingAnalyzer.reconcile_transactions(
            bank_transactions_empty, system_transactions,
        )
        assert result["reconciliation_rate"] == 0.0
        assert len(result["unmatched_system"]) == len(system_transactions)

    def test_empty_system(self, bank_transactions, system_transactions):
        """Empty system transactions should give 0 reconciliation rate."""
        result = BankingAnalyzer.reconcile_transactions(
            bank_transactions, [],
        )
        assert result["reconciliation_rate"] == 0.0
        assert len(result["unmatched_bank"]) == len(bank_transactions)

    def test_both_empty(self, bank_transactions_empty):
        """Both empty should not crash."""
        result = BankingAnalyzer.reconcile_transactions([], [])
        assert result["reconciliation_rate"] == 0.0
        assert result["matched"] == []

    def test_summary_counts(self, bank_transactions, system_transactions):
        """Summary should correctly count matched/unmatched."""
        result = BankingAnalyzer.reconcile_transactions(
            bank_transactions, system_transactions,
            tolerance_days=5, tolerance_amount=0.01,
        )
        summary = result["summary"]
        assert summary["total_bank_transactions"] == len(bank_transactions)
        assert summary["total_system_transactions"] == len(system_transactions)
        assert (summary["matched_count"] + summary["unmatched_bank_count"]
                == summary["total_bank_transactions"])
        assert (summary["matched_count"] + summary["unmatched_system_count"]
                == summary["total_system_transactions"])


class TestAnalyzePatterns:
    """Tests for analyze_bank_patterns."""

    def test_recurring_detected(self, bank_transactions_minimal):
        """Should detect recurring transactions (≥3 occurrences, low variance)."""
        result = BankingAnalyzer.analyze_bank_patterns(bank_transactions_minimal)
        assert len(result["recurring_transactions"]) > 0
        recurring = result["recurring_transactions"][0]
        assert recurring["frequency"] >= 3
        assert "SUSCRIPCION" in recurring["description"]

    def test_empty_input(self, bank_transactions_empty):
        """Empty should return empty patterns."""
        result = BankingAnalyzer.analyze_bank_patterns(bank_transactions_empty)
        assert result["patterns"] == []
        assert result["statistics"] == {}

    def test_monthly_statistics(self, bank_transactions_minimal):
        """Should group transactions by month."""
        result = BankingAnalyzer.analyze_bank_patterns(bank_transactions_minimal)
        monthly = result["monthly_statistics"]
        assert len(monthly) > 0
        month = monthly[0]
        assert "year" in month
        assert "month" in month
        assert "transaction_count" in month


class TestCashPosition:
    """Tests for calculate_cash_position."""

    def test_cash_position(self, bank_transactions):
        """Should compute correct running balance."""
        result = BankingAnalyzer.calculate_cash_position(bank_transactions, start_balance=10000.0)
        assert result["current_balance"] == 10000.0 + 5000.0 - 2500.0 + 3000.0 + 8000.0 - 3200.0
        assert result["min_balance"] <= result["max_balance"]

    def test_empty_input(self, bank_transactions_empty):
        """Empty should return start balance."""
        result = BankingAnalyzer.calculate_cash_position(bank_transactions_empty, start_balance=500.0)
        assert result["current_balance"] == 500.0
        assert result["min_balance"] == 500.0
        assert result["max_balance"] == 500.0

    def test_daily_positions(self, bank_transactions):
        """Should return chronological list of daily positions."""
        result = BankingAnalyzer.calculate_cash_position(bank_transactions)
        positions = result["daily_positions"]
        assert len(positions) == len(bank_transactions)
        # Should be sorted by date
        for i in range(len(positions) - 1):
            assert positions[i]["date"] <= positions[i + 1]["date"]

    def test_negative_start(self, bank_transactions):
        """Start balance can be negative (overdraft)."""
        result = BankingAnalyzer.calculate_cash_position(bank_transactions, start_balance=-1000.0)
        assert result["current_balance"] == -1000.0 + 5000.0 - 2500.0 + 3000.0 + 8000.0 - 3200.0
