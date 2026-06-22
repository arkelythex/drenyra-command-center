"""
Tests for SireProcessor — SUNAT SIRE (Compras/Ventas) CSV processing.
"""

import pytest
from src.services.sire_processor import SireProcessor


class TestSireCompras:
    """Tests for process_sire_compras."""

    def test_basic_processing(self, sire_compras_csv):
        """Should parse 3 invoice rows and compute correct totals."""
        result = SireProcessor.process_sire_compras(sire_compras_csv)
        assert result["status"] == "success"
        assert result["processed_rows"] == 3
        assert result["summary"]["total_purchases"] == 1180.00 + 2950.00 + 590.00
        assert result["summary"]["total_igv"] == 180.00 + 450.00 + 90.00
        assert result["summary"]["total_base"] == 1000.00 + 2500.00 + 500.00
        assert result["summary"]["invoice_count"] == 3

    def test_empty_csv(self, sire_compras_csv_empty):
        """Empty CSV should succeed with 0 rows."""
        result = SireProcessor.process_sire_compras(sire_compras_csv_empty)
        assert result["status"] == "success"
        assert result["processed_rows"] == 0
        assert result["summary"]["total_purchases"] == 0.0

    def test_corrupted_data(self, sire_compras_csv_invalid_data):
        """Invalid CSV should return error status, not crash."""
        result = SireProcessor.process_sire_compras(sire_compras_csv_invalid_data)
        assert result["status"] == "error"
        assert "error" in result

    def test_top_providers_aggregation(self, sire_compras_csv):
        """Top providers should be sorted by total descending."""
        result = SireProcessor.process_sire_compras(sire_compras_csv)
        providers = result["top_providers"]
        assert len(providers) > 0
        # PROVEEDOR UNO SAC has 2 invoices, total = 1180 + 590 = 1770
        # PROVEEDOR DOS SA has 1 invoice, total = 2950
        assert providers[0]["provider_name"] == "PROVEEDOR DOS SA"
        assert providers[0]["total_purchases"] == 2950.00

    def test_monthly_breakdown(self, sire_compras_csv):
        """Monthly breakdown should group by year/month."""
        result = SireProcessor.process_sire_compras(sire_compras_csv)
        assert len(result["monthly_breakdown"]) > 0
        # All January 2025
        month = result["monthly_breakdown"][0]
        assert month["year"] == 2025
        assert month["month"] == 1

    def test_missing_igv_detected(self, sire_compras_csv_missing_igv):
        """Should detect invoices with base_imponible > 0 but igv == 0."""
        result = SireProcessor.process_sire_compras(sire_compras_csv_missing_igv)
        issues = result["validation_issues"]
        missing_igv_issues = [i for i in issues if i["type"] == "missing_igv"]
        assert len(missing_igv_issues) == 1
        assert missing_igv_issues[0]["count"] == 1

    def test_invalid_ruc_detected(self, sire_compras_csv_invalid_ruc):
        """Should detect RUCs with length != 11."""
        result = SireProcessor.process_sire_compras(sire_compras_csv_invalid_ruc)
        issues = result["validation_issues"]
        ruc_issues = [i for i in issues if i["type"] == "invalid_ruc"]
        assert len(ruc_issues) == 1
        assert ruc_issues[0]["count"] == 1


class TestSireVentas:
    """Tests for process_sire_ventas."""

    def test_basic_processing(self, sire_ventas_csv):
        """Should parse 2 invoice rows and compute correct totals."""
        result = SireProcessor.process_sire_ventas(sire_ventas_csv)
        assert result["status"] == "success"
        assert result["processed_rows"] == 2
        assert result["summary"]["total_sales"] == 5900.00 + 3540.00
        assert result["summary"]["total_igv"] == 900.00 + 540.00
        assert result["summary"]["total_base"] == 5000.00 + 3000.00

    def test_by_document_type(self, sire_ventas_csv_multiple_doc_types):
        """Should break down sales by document type."""
        result = SireProcessor.process_sire_ventas(sire_ventas_csv_multiple_doc_types)
        assert result["status"] == "success"
        doc_types = result["by_document_type"]
        # We have 3 doc types: 01 (factura), 03 (boleta), 07 (nota de crédito)
        assert len(doc_types) == 3
        # Factura (01) should be first (largest total): 1180 + 2360 = 3540
        factura = next(dt for dt in doc_types if dt["tipo_comprobante"] == "01")
        assert factura["total"] == 1180.00 + 2360.00
        assert factura["count"] == 2

    def test_invalid_data_returns_error(self):
        """Corrupted input should not crash."""
        result = SireProcessor.process_sire_ventas(b"\xff\xfe\x00\x01corrupted")
        assert result["status"] == "error"

    def test_top_customers(self, sire_ventas_csv_multiple_doc_types):
        """Top customers should be sorted by total sales."""
        result = SireProcessor.process_sire_ventas(sire_ventas_csv_multiple_doc_types)
        customers = result["top_customers"]
        assert len(customers) > 0
        # CLIENTE C (20456789012) has 1 invoice: 9440
        top = customers[0]
        assert top["total_sales"] == 9440.00
