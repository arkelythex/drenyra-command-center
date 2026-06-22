"""
Cashflow Analyzer Service
Uses Polars for high-performance financial data analysis
"""

import polars as pl
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sklearn.linear_model import LinearRegression
import numpy as np


class CashflowAnalyzer:
    """
    Analyzes cashflow patterns and generates forecasts using Polars + scikit-learn
    """

    @staticmethod
    def analyze_historical_cashflow(
        transactions_data: List[Dict[str, Any]],
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Analyze historical cashflow from transaction data

        Args:
            transactions_data: List of transaction dicts with fields:
                - date: ISO date string
                - type: 'INCOME' or 'EXPENSE'
                - amount: decimal amount
                - category: category name
            start_date: Filter start (ISO format)
            end_date: Filter end (ISO format)

        Returns:
            Dictionary with analysis results
        """
        if not transactions_data:
            return {
                "total_income": 0,
                "total_expenses": 0,
                "net_cashflow": 0,
                "daily_cashflow": [],
                "category_breakdown": [],
            }

        # 1. Load data into Polars DataFrame (ultra-fast)
        df = pl.DataFrame(transactions_data)

        # 2. Data cleaning and type conversion
        df = df.with_columns([
            pl.col("date").str.to_date("%Y-%m-%d"),
            pl.col("amount").cast(pl.Float64),
        ])

        # 3. Apply date filters if provided
        if start_date:
            df = df.filter(pl.col("date") >= pl.lit(start_date).str.to_date("%Y-%m-%d"))
        if end_date:
            df = df.filter(pl.col("date") <= pl.lit(end_date).str.to_date("%Y-%m-%d"))

        # 4. Calculate totals by type
        totals = (
            df.group_by("type")
            .agg([pl.sum("amount").alias("total")])
            .to_dicts()
        )

        income_total = next((t["total"] for t in totals if t["type"] == "INCOME"), 0)
        expense_total = next((t["total"] for t in totals if t["type"] == "EXPENSE"), 0)

        # 5. Daily cashflow (running balance)
        daily_cashflow = (
            df.with_columns([
                pl.when(pl.col("type") == "INCOME")
                .then(pl.col("amount"))
                .otherwise(-pl.col("amount"))
                .alias("signed_amount")
            ])
            .group_by("date")
            .agg([pl.sum("signed_amount").alias("daily_net")])
            .sort("date")
            .with_columns([
                pl.col("daily_net").cum_sum().alias("running_balance")
            ])
            .select(["date", "daily_net", "running_balance"])
            .to_dicts()
        )

        # 6. Category breakdown (Pareto analysis)
        category_breakdown = (
            df.group_by(["type", "category"])
            .agg([
                pl.sum("amount").alias("total"),
                pl.count("amount").alias("transaction_count"),
            ])
            .sort("total", descending=True)
            .to_dicts()
        )

        return {
            "total_income": float(income_total),
            "total_expenses": float(expense_total),
            "net_cashflow": float(income_total - expense_total),
            "daily_cashflow": daily_cashflow,
            "category_breakdown": category_breakdown,
            "period": {
                "start": str(df["date"].min()) if len(df) > 0 else None,
                "end": str(df["date"].max()) if len(df) > 0 else None,
            },
        }

    @staticmethod
    def forecast_cashflow(
        historical_data: List[Dict[str, Any]],
        forecast_days: int = 90,
    ) -> Dict[str, Any]:
        """
        Forecast future cashflow using linear regression

        Args:
            historical_data: Transaction history (same format as analyze_historical_cashflow)
            forecast_days: Number of days to forecast

        Returns:
            Forecast results with predictions and confidence intervals
        """
        if not historical_data or len(historical_data) < 7:
            return {
                "error": "Insufficient data for forecasting (need at least 7 days)",
                "forecast": [],
            }

        # 1. Load and prepare data
        df = pl.DataFrame(historical_data)
        df = df.with_columns([
            pl.col("date").str.to_date("%Y-%m-%d"),
            pl.col("amount").cast(pl.Float64),
        ])

        # 2. Calculate daily net cashflow
        daily_net = (
            df.with_columns([
                pl.when(pl.col("type") == "INCOME")
                .then(pl.col("amount"))
                .otherwise(-pl.col("amount"))
                .alias("signed_amount")
            ])
            .group_by("date")
            .agg([pl.sum("signed_amount").alias("net")])
            .sort("date")
        )

        # 3. Convert to numpy for ML
        net_amounts = daily_net["net"].to_numpy()

        # 4. Prepare features (days since start) — Polars date iteration yields native datetime.date
        dates_py = list(daily_net["date"])
        start_date_py = dates_py[0]
        X = np.array([(d - start_date_py).days for d in dates_py]).reshape(-1, 1)
        y = net_amounts

        # 5. Train linear regression model
        model = LinearRegression()
        model.fit(X, y)

        # 6. Generate forecast
        last_date_py = dates_py[-1]
        forecast_dates = [
            last_date_py + timedelta(days=i + 1) for i in range(forecast_days)
        ]
        forecast_X = np.array([
            (d - start_date_py).days for d in forecast_dates
        ]).reshape(-1, 1)

        predictions = model.predict(forecast_X)

        # 7. Calculate confidence interval (simple stddev-based)
        residuals = y - model.predict(X)
        std_error = np.std(residuals)

        forecast_results = [
            {
                "date": str(date),
                "predicted_net": float(pred),
                "confidence_lower": float(pred - 1.96 * std_error),
                "confidence_upper": float(pred + 1.96 * std_error),
            }
            for date, pred in zip(forecast_dates, predictions)
        ]

        return {
            "forecast": forecast_results,
            "model_score": float(model.score(X, y)),  # R² score
            "trend": "positive" if model.coef_[0] > 0 else "negative",
            "avg_daily_change": float(model.coef_[0]),
        }

    @staticmethod
    def detect_cashflow_anomalies(
        transactions_data: List[Dict[str, Any]],
        threshold_std: float = 2.0,
    ) -> Dict[str, Any]:
        """
        Detect unusual cashflow patterns using statistical methods

        Args:
            transactions_data: Transaction history
            threshold_std: Number of standard deviations for anomaly detection

        Returns:
            Detected anomalies and statistics
        """
        if not transactions_data:
            return {"anomalies": [], "statistics": {}}

        # 1. Load data
        df = pl.DataFrame(transactions_data)
        df = df.with_columns([
            pl.col("date").str.to_date("%Y-%m-%d"),
            pl.col("amount").cast(pl.Float64),
        ])

        # 2. Calculate daily aggregates
        daily = (
            df.with_columns([
                pl.when(pl.col("type") == "INCOME")
                .then(pl.col("amount"))
                .otherwise(-pl.col("amount"))
                .alias("signed_amount")
            ])
            .group_by("date")
            .agg([
                pl.sum("signed_amount").alias("net"),
                pl.count("signed_amount").alias("tx_count"),
            ])
            .sort("date")
        )

        # 3. Calculate statistics
        mean_net = daily["net"].mean()
        std_net = daily["net"].std()

        # 4. Detect anomalies (beyond threshold_std standard deviations)
        anomalies = (
            daily.filter(
                (pl.col("net") > mean_net + threshold_std * std_net) |
                (pl.col("net") < mean_net - threshold_std * std_net)
            )
            .with_columns([
                ((pl.col("net") - mean_net) / std_net).alias("z_score")
            ])
            .to_dicts()
        )

        return {
            "anomalies": anomalies,
            "statistics": {
                "mean_daily_net": float(mean_net),
                "std_daily_net": float(std_net),
                "threshold_used": threshold_std,
                "anomaly_count": len(anomalies),
            },
        }
