"""
Banking Analyzer Service
High-performance banking transaction analysis and reconciliation
"""

import polars as pl
from typing import Dict, List, Any


class BankingAnalyzer:
    """
    Analyzes bank statements and performs reconciliation using Polars
    """

    @staticmethod
    def parse_bank_statement(
        file_content: bytes,
        file_format: str = "csv",
        bank_name: str = "generic",
    ) -> List[Dict[str, Any]]:
        """
        Parse bank statement file (CSV/Excel) into standardized format

        Args:
            file_content: Raw file bytes
            file_format: 'csv' or 'excel'
            bank_name: 'bcp', 'interbank', 'bbva', or 'generic'

        Returns:
            List of standardized transactions
        """
        # Different banks have different formats - we'll handle the most common ones
        bank_mappings = {
            "bcp": {
                "date_col": "Fecha",
                "description_col": "Descripción",
                "debit_col": "Cargo",
                "credit_col": "Abono",
                "balance_col": "Saldo",
            },
            "interbank": {
                "date_col": "FECHA",
                "description_col": "DETALLE",
                "debit_col": "DEBITO",
                "credit_col": "CREDITO",
                "balance_col": "SALDO",
            },
            "bbva": {
                "date_col": "Fecha Operación",
                "description_col": "Descripción",
                "debit_col": "Importe Débito",
                "credit_col": "Importe Crédito",
                "balance_col": "Saldo",
            },
            "generic": {
                "date_col": "date",
                "description_col": "description",
                "debit_col": "debit",
                "credit_col": "credit",
                "balance_col": "balance",
            },
        }

        mapping = bank_mappings.get(bank_name.lower(), bank_mappings["generic"])

        # Parse based on format
        if file_format == "csv":
            df = pl.read_csv(file_content)
        elif file_format == "excel":
            # For Excel, we'd use pl.read_excel (requires openpyxl)
            import io

            df = pl.read_excel(io.BytesIO(file_content))
        else:
            raise ValueError(f"Unsupported format: {file_format}")

        # Standardize column names
        df = df.rename(
            {
                mapping["date_col"]: "date",
                mapping["description_col"]: "description",
                mapping["debit_col"]: "debit",
                mapping["credit_col"]: "credit",
                mapping["balance_col"]: "balance",
            }
        )

        # Clean and convert types
        df = df.with_columns(
            [
                pl.col("date").str.to_date("%Y-%m-%d", strict=False),
                pl.col("debit").cast(pl.Float64, strict=False).fill_null(0),
                pl.col("credit").cast(pl.Float64, strict=False).fill_null(0),
                pl.col("balance").cast(pl.Float64, strict=False),
            ]
        )

        # Add net amount column
        df = df.with_columns([(pl.col("credit") - pl.col("debit")).alias("net_amount")])

        return df.to_dicts()

    @staticmethod
    def reconcile_transactions(
        bank_transactions: List[Dict[str, Any]],
        system_transactions: List[Dict[str, Any]],
        tolerance_days: int = 3,
        tolerance_amount: float = 0.01,
    ) -> Dict[str, Any]:
        """
        Reconcile bank statement with system transactions

        Args:
            bank_transactions: Parsed bank statement
            system_transactions: System recorded transactions
            tolerance_days: Date matching tolerance
            tolerance_amount: Amount matching tolerance (for rounding)

        Returns:
            Reconciliation results with matched/unmatched transactions
        """
        if not bank_transactions or not system_transactions:
            return {
                "matched": [],
                "unmatched_bank": bank_transactions or [],
                "unmatched_system": system_transactions or [],
                "reconciliation_rate": 0.0,
            }

        # 1. Load data into Polars
        bank_df = pl.DataFrame(bank_transactions).with_columns(
            [
                pl.col("date").str.to_date(),
                pl.col("net_amount").cast(pl.Float64),
            ]
        )

        system_df = pl.DataFrame(system_transactions).with_columns(
            [
                pl.col("date").str.to_date(),
                pl.col("amount").cast(pl.Float64),
            ]
        )

        # 2. Fuzzy matching logic (using cross join + filters)
        # This is computationally expensive but Polars handles it efficiently
        matched = []
        unmatched_bank = []
        unmatched_system = []

        bank_matched_ids = set()
        system_matched_ids = set()

        # Simple matching algorithm (can be optimized further)
        for bank_tx in bank_df.iter_rows(named=True):
            bank_date = bank_tx["date"]
            bank_amount = abs(bank_tx["net_amount"])

            # Find potential matches in system transactions
            potential_matches = system_df.filter(
                (pl.col("date") >= bank_date - pl.duration(days=tolerance_days))
                & (pl.col("date") <= bank_date + pl.duration(days=tolerance_days))
                & (pl.col("amount") >= bank_amount - tolerance_amount)
                & (pl.col("amount") <= bank_amount + tolerance_amount)
            )

            if len(potential_matches) > 0:
                # Take best match (closest date + amount)
                best_match = potential_matches.to_dicts()[0]

                matched.append(
                    {
                        "bank_transaction": bank_tx,
                        "system_transaction": best_match,
                        "confidence": "high",  # Can add scoring logic
                    }
                )

                bank_matched_ids.add(id(bank_tx))
                system_matched_ids.add(best_match.get("id"))
            else:
                unmatched_bank.append(bank_tx)

        # Find unmatched system transactions
        for sys_tx in system_df.iter_rows(named=True):
            if sys_tx.get("id") not in system_matched_ids:
                unmatched_system.append(sys_tx)

        total_transactions = len(bank_df) + len(system_df)
        reconciliation_rate = (
            (len(matched) * 2) / total_transactions if total_transactions > 0 else 0
        )

        return {
            "matched": matched,
            "unmatched_bank": unmatched_bank,
            "unmatched_system": unmatched_system,
            "reconciliation_rate": float(reconciliation_rate),
            "summary": {
                "total_bank_transactions": len(bank_df),
                "total_system_transactions": len(system_df),
                "matched_count": len(matched),
                "unmatched_bank_count": len(unmatched_bank),
                "unmatched_system_count": len(unmatched_system),
            },
        }

    @staticmethod
    def analyze_bank_patterns(
        transactions: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Analyze banking patterns (recurring payments, cash flow trends)

        Args:
            transactions: Bank transactions

        Returns:
            Pattern analysis results
        """
        if not transactions:
            return {"patterns": [], "statistics": {}}

        df = pl.DataFrame(transactions)

        # Ensure date column is cast to Date type for .dt accessors
        if "date" in df.columns:
            df = df.with_columns([pl.col("date").str.to_date()])

        # 1. Identify recurring transactions (same description + similar amount)
        recurring = (
            df.group_by("description")
            .agg(
                [
                    pl.count("description").alias("frequency"),
                    pl.mean("net_amount").alias("avg_amount"),
                    pl.std("net_amount").alias("std_amount"),
                    pl.min("date").alias("first_occurrence"),
                    pl.max("date").alias("last_occurrence"),
                ]
            )
            .filter(pl.col("frequency") >= 3)  # At least 3 occurrences
            .filter(pl.col("std_amount") < 10)  # Low variance in amount
            .sort("frequency", descending=True)
        )

        # 2. Calculate monthly statistics
        monthly_stats = (
            df.with_columns(
                [
                    pl.col("date").dt.month().alias("month"),
                    pl.col("date").dt.year().alias("year"),
                ]
            )
            .group_by(["year", "month"])
            .agg(
                [
                    pl.when(pl.col("net_amount") > 0)
                    .then(pl.col("net_amount"))
                    .otherwise(0)
                    .sum()
                    .alias("total_credits"),
                    pl.when(pl.col("net_amount") < 0)
                    .then(pl.col("net_amount").abs())
                    .otherwise(0)
                    .sum()
                    .alias("total_debits"),
                    pl.count("net_amount").alias("transaction_count"),
                ]
            )
            .sort(["year", "month"])
        )

        return {
            "recurring_transactions": recurring.to_dicts(),
            "monthly_statistics": monthly_stats.to_dicts(),
            "total_analyzed": len(df),
        }

    @staticmethod
    def calculate_cash_position(
        transactions: List[Dict[str, Any]],
        start_balance: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Calculate running cash position from transactions

        Args:
            transactions: Bank transactions
            start_balance: Starting balance

        Returns:
            Cash position analysis
        """
        if not transactions:
            return {
                "current_balance": start_balance,
                "min_balance": start_balance,
                "max_balance": start_balance,
                "daily_positions": [],
            }

        df = pl.DataFrame(transactions)
        df = df.with_columns(
            [
                pl.col("date").str.to_date(),
                pl.col("net_amount").cast(pl.Float64),
            ]
        ).sort("date")

        # Calculate running balance
        df = df.with_columns([(start_balance + pl.col("net_amount").cum_sum()).alias("balance")])

        return {
            "current_balance": float(df["balance"][-1]),
            "min_balance": float(df["balance"].min()),
            "max_balance": float(df["balance"].max()),
            "avg_balance": float(df["balance"].mean()),
            "daily_positions": df.select(["date", "balance"]).to_dicts(),
        }
