"""
SIRE (Sistema Integrado de Registros Electrónicos) Processor
Processes SUNAT SIRE files (purchases/sales) using Polars for high performance
"""

import io
from typing import Any

import polars as pl


class SireProcessor:
    """
    Processes SUNAT SIRE files (Compras/Ventas) with Polars
    """

    SIRE_COMPRAS_NORMA = "SUNAT SIRE — Libro Electrónico de Compras"
    SIRE_VENTAS_NORMA = "SUNAT SIRE — Libro Electrónico de Ventas"
    SIRE_COMPRAS_TABLE_VERSION = "sire-compras-format-2024-v1"
    SIRE_VENTAS_TABLE_VERSION = "sire-ventas-format-2024-v1"
    SOURCE = "apps/data-engine/src/services/sire_processor.py"

    # SIRE CSV Standard columns (SUNAT format)
    SIRE_COMPRAS_COLUMNS = [
        "periodo",
        "correlativo",
        "fecha_emision",
        "fecha_vcto_pago",
        "tipo_comprobante",
        "serie",
        "numero",
        "tipo_doc_proveedor",
        "num_doc_proveedor",
        "razon_social_proveedor",
        "base_imponible",
        "igv",
        "total",
        "moneda",
        "tipo_cambio",
        "referencia_fecha",
        "referencia_tipo",
        "referencia_serie",
        "referencia_numero",
        "estado",
    ]

    SIRE_VENTAS_COLUMNS = [
        "periodo",
        "correlativo",
        "fecha_emision",
        "tipo_comprobante",
        "serie",
        "numero",
        "tipo_doc_cliente",
        "num_doc_cliente",
        "razon_social_cliente",
        "valor_exportacion",
        "base_imponible",
        "igv",
        "total",
        "moneda",
        "tipo_cambio",
        "estado",
    ]

    @staticmethod
    def process_sire_compras(file_content: bytes) -> dict[str, Any]:
        """
        Process SIRE Compras (Purchases) file

        Args:
            file_content: CSV file bytes (SUNAT SIRE format)

        Returns:
            Processed results with aggregations
        """
        try:
            # 1. Parse CSV (Polars is extremely fast at this)
            df = pl.read_csv(
                io.BytesIO(file_content),
                separator="|",  # SIRE uses pipe delimiter
                has_header=True,
                truncate_ragged_lines=True,
                ignore_errors=True,
                infer_schema_length=0,  # Read all as string; dates need str conversion
            )

            # 2. Data cleaning and validation
            df = df.with_columns(
                [
                    pl.col("fecha_emision").str.to_date("%Y%m%d", strict=False),
                    pl.col("base_imponible").cast(pl.Float64, strict=False).fill_null(0),
                    pl.col("igv").cast(pl.Float64, strict=False).fill_null(0),
                    pl.col("total").cast(pl.Float64, strict=False).fill_null(0),
                ]
            )

            # 3. Summary statistics
            total_purchases = float(df["total"].sum())
            total_igv = float(df["igv"].sum())
            total_base = float(df["base_imponible"].sum())

            # 4. Aggregation by provider
            by_provider = (
                df.group_by("num_doc_proveedor")
                .agg(
                    [
                        pl.first("razon_social_proveedor").alias("provider_name"),
                        pl.sum("total").alias("total_purchases"),
                        pl.sum("igv").alias("total_igv"),
                        pl.count("total").alias("invoice_count"),
                    ]
                )
                .sort("total_purchases", descending=True)
                .limit(20)  # Top 20 providers
            )

            # 5. Aggregation by month
            by_month = (
                df.with_columns(
                    [
                        pl.col("fecha_emision").dt.month().alias("month"),
                        pl.col("fecha_emision").dt.year().alias("year"),
                    ]
                )
                .group_by(["year", "month"])
                .agg(
                    [
                        pl.sum("total").alias("total"),
                        pl.sum("igv").alias("igv"),
                        pl.count("total").alias("count"),
                    ]
                )
                .sort(["year", "month"])
            )

            # 6. Validation issues
            issues = []

            # Check for missing IGV
            missing_igv = df.filter((pl.col("igv") == 0) & (pl.col("base_imponible") > 0))
            if len(missing_igv) > 0:
                issues.append(
                    {
                        "type": "missing_igv",
                        "count": len(missing_igv),
                        "message": f"{len(missing_igv)} invoices with base but no IGV",
                    }
                )

            # Check for invalid RUC
            invalid_ruc = df.filter(pl.col("num_doc_proveedor").str.len_chars() != 11)
            if len(invalid_ruc) > 0:
                issues.append(
                    {
                        "type": "invalid_ruc",
                        "count": len(invalid_ruc),
                        "message": f"{len(invalid_ruc)} invoices with invalid RUC format",
                    }
                )

            return {
                "status": "success",
                "processed_rows": len(df),
                "summary": {
                    "total_purchases": total_purchases,
                    "total_igv": total_igv,
                    "total_base": total_base,
                    "invoice_count": len(df),
                },
                "top_providers": by_provider.to_dicts(),
                "monthly_breakdown": by_month.to_dicts(),
                "validation_issues": issues,
                "norma_aplicada": SireProcessor.SIRE_COMPRAS_NORMA,
                "version_tabla": SireProcessor.SIRE_COMPRAS_TABLE_VERSION,
                "deterministic": True,
                "source": SireProcessor.SOURCE,
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "message": "Failed to process SIRE Compras file",
            }

    @staticmethod
    def process_sire_ventas(file_content: bytes) -> dict[str, Any]:
        """
        Process SIRE Ventas (Sales) file

        Args:
            file_content: CSV file bytes (SUNAT SIRE format)

        Returns:
            Processed results with aggregations
        """
        try:
            # 1. Parse CSV
            df = pl.read_csv(
                io.BytesIO(file_content),
                separator="|",
                has_header=True,
                truncate_ragged_lines=True,
                ignore_errors=True,
                infer_schema_length=0,  # Read all as string; dates need str conversion
            )

            # 2. Data cleaning
            df = df.with_columns(
                [
                    pl.col("fecha_emision").str.to_date("%Y%m%d", strict=False),
                    pl.col("base_imponible").cast(pl.Float64, strict=False).fill_null(0),
                    pl.col("igv").cast(pl.Float64, strict=False).fill_null(0),
                    pl.col("total").cast(pl.Float64, strict=False).fill_null(0),
                ]
            )

            # 3. Summary statistics
            total_sales = float(df["total"].sum())
            total_igv = float(df["igv"].sum())
            total_base = float(df["base_imponible"].sum())

            # 4. Aggregation by customer
            by_customer = (
                df.group_by("num_doc_cliente")
                .agg(
                    [
                        pl.first("razon_social_cliente").alias("customer_name"),
                        pl.sum("total").alias("total_sales"),
                        pl.sum("igv").alias("total_igv"),
                        pl.count("total").alias("invoice_count"),
                    ]
                )
                .sort("total_sales", descending=True)
                .limit(20)
            )

            # 5. Aggregation by document type
            by_doc_type = (
                df.group_by("tipo_comprobante")
                .agg(
                    [
                        pl.sum("total").alias("total"),
                        pl.count("total").alias("count"),
                    ]
                )
                .sort("total", descending=True)
            )

            return {
                "status": "success",
                "processed_rows": len(df),
                "summary": {
                    "total_sales": total_sales,
                    "total_igv": total_igv,
                    "total_base": total_base,
                    "invoice_count": len(df),
                },
                "top_customers": by_customer.to_dicts(),
                "by_document_type": by_doc_type.to_dicts(),
                "norma_aplicada": SireProcessor.SIRE_VENTAS_NORMA,
                "version_tabla": SireProcessor.SIRE_VENTAS_TABLE_VERSION,
                "deterministic": True,
                "source": SireProcessor.SOURCE,
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "message": "Failed to process SIRE Ventas file",
            }
