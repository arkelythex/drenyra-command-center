"""
Tests for CashflowAnalyzer — historical analysis, forecasting, anomaly detection.
"""

import pytest
from src.services.cashflow_analyzer import CashflowAnalyzer


class TestAnalyzeHistorical:
    """Tests for analyze_historical_cashflow."""

    def test_basic_analysis(self, cashflow_transactions):
        """Should correctly compute income, expenses, and net cashflow."""
        result = CashflowAnalyzer.analyze_historical_cashflow(cashflow_transactions)
        assert result["total_income"] == 10000.0 + 5000.0 + 12000.0 + 3000.0
        assert result["total_expenses"] == 3000.0 + 1500.0 + 2000.0 + 3200.0 + 1800.0
        assert result["net_cashflow"] == result["total_income"] - result["total_expenses"]

    def test_daily_cashflow(self, cashflow_transactions):
        """Daily cashflow should include running balance."""
        result = CashflowAnalyzer.analyze_historical_cashflow(cashflow_transactions)
        daily = result["daily_cashflow"]
        assert len(daily) > 0
        # First entry should only have its own net as balance
        assert daily[0]["running_balance"] == daily[0]["daily_net"]

    def test_category_breakdown(self, cashflow_transactions):
        """Should break down income/expenses by category."""
        result = CashflowAnalyzer.analyze_historical_cashflow(cashflow_transactions)
        breakdown = result["category_breakdown"]
        assert len(breakdown) > 0
        # Should have ventas, planilla, servicios, proveedores categories
        categories = {item["category"] for item in breakdown}
        assert "ventas" in categories
        assert "planilla" in categories

    def test_empty_input(self, cashflow_transactions_empty):
        """Empty input should return zeroed results."""
        result = CashflowAnalyzer.analyze_historical_cashflow(cashflow_transactions_empty)
        assert result["total_income"] == 0
        assert result["total_expenses"] == 0
        assert result["net_cashflow"] == 0
        assert result["daily_cashflow"] == []
        assert result["category_breakdown"] == []

    def test_single_type(self, cashflow_single_type):
        """Only income transactions — expenses should be 0."""
        result = CashflowAnalyzer.analyze_historical_cashflow(cashflow_single_type)
        assert result["total_income"] > 0
        assert result["total_expenses"] == 0
        assert result["net_cashflow"] == result["total_income"]

    def test_period_detection(self, cashflow_transactions):
        """Should detect correct date range."""
        result = CashflowAnalyzer.analyze_historical_cashflow(cashflow_transactions)
        assert result["period"]["start"] is not None
        assert result["period"]["end"] is not None

    def test_date_filter(self, cashflow_transactions):
        """Date filters should narrow results."""
        result = CashflowAnalyzer.analyze_historical_cashflow(
            cashflow_transactions,
            start_date="2025-02-01",
        )
        # Should only include February transactions
        assert len(result["daily_cashflow"]) >= 3  # 3 Feb transactions


class TestForecast:
    """Tests for forecast_cashflow."""

    def test_basic_forecast(self, cashflow_transactions):
        """Should generate forecast with predictions."""
        result = CashflowAnalyzer.forecast_cashflow(cashflow_transactions, forecast_days=30)
        assert "forecast" in result
        assert "error" not in result
        assert len(result["forecast"]) == 30
        # Each forecast entry should have date and predicted_net
        entry = result["forecast"][0]
        assert "date" in entry
        assert "predicted_net" in entry
        assert "confidence_lower" in entry
        assert "confidence_upper" in entry

    def test_insufficient_data(self, cashflow_insufficient_forecast):
        """Less than 7 days of data should return error."""
        result = CashflowAnalyzer.forecast_cashflow(cashflow_insufficient_forecast)
        assert "error" in result
        assert result["forecast"] == []

    def test_empty_data(self, cashflow_transactions_empty):
        """Empty data should return error."""
        result = CashflowAnalyzer.forecast_cashflow(cashflow_transactions_empty)
        assert "error" in result

    def test_trend_direction(self, cashflow_transactions):
        """Forecast should report trend direction and R² score."""
        result = CashflowAnalyzer.forecast_cashflow(cashflow_transactions)
        assert result["trend"] in ("positive", "negative")
        assert "model_score" in result
        assert isinstance(result["model_score"], float)
        assert "avg_daily_change" in result

    def test_confidence_interval(self, cashflow_transactions):
        """Confidence lower should be <= predicted <= upper."""
        result = CashflowAnalyzer.forecast_cashflow(cashflow_transactions, forecast_days=5)
        for entry in result["forecast"]:
            assert entry["confidence_lower"] <= entry["predicted_net"]
            assert entry["predicted_net"] <= entry["confidence_upper"]


class TestDetectAnomalies:
    """Tests for detect_cashflow_anomalies."""

    def test_anomaly_detection(self, cashflow_transactions):
        """Should detect anomalies beyond threshold."""
        result = CashflowAnalyzer.detect_cashflow_anomalies(
            cashflow_transactions, threshold_std=1.0
        )
        assert "anomalies" in result
        assert "statistics" in result
        assert result["statistics"]["mean_daily_net"] is not None
        assert result["statistics"]["std_daily_net"] is not None

    def test_empty_input(self, cashflow_transactions_empty):
        """Empty input should return empty anomalies."""
        result = CashflowAnalyzer.detect_cashflow_anomalies(cashflow_transactions_empty)
        assert result["anomalies"] == []
        assert result["statistics"] == {}

    def test_strict_threshold(self, cashflow_transactions):
        """Higher threshold should detect fewer anomalies."""
        strict = CashflowAnalyzer.detect_cashflow_anomalies(
            cashflow_transactions, threshold_std=5.0
        )
        relaxed = CashflowAnalyzer.detect_cashflow_anomalies(
            cashflow_transactions, threshold_std=0.5
        )
        assert strict["statistics"]["anomaly_count"] <= relaxed["statistics"]["anomaly_count"]
