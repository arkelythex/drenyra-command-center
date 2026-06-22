"""
Shared test fixtures for data-engine services.
"""

import polars as pl
import pytest
from typing import List, Dict, Any


# ── SIRE processor fixtures ────────────────────────────────────────────────

@pytest.fixture
def sire_compras_csv() -> bytes:
    """Sample SIRE Compras CSV data (pipe-delimited, SUNAT format)."""
    return (
        "periodo|correlativo|fecha_emision|fecha_vcto_pago|tipo_comprobante|serie|numero|tipo_doc_proveedor|num_doc_proveedor|razon_social_proveedor|base_imponible|igv|total|moneda|tipo_cambio|referencia_fecha|referencia_tipo|referencia_serie|referencia_numero|estado\n"  # noqa: E501
        "202501|0001|20250115|20250215|01|F001|0001|6|20123456789|PROVEEDOR UNO SAC|1000.00|180.00|1180.00|PEN|1.00||||1\n"
        "202501|0002|20250120|20250220|01|F001|0002|6|20987654321|PROVEEDOR DOS SA|2500.00|450.00|2950.00|PEN|1.00||||1\n"
        "202501|0003|20250125|20250225|01|F001|0003|6|20123456789|PROVEEDOR UNO SAC|500.00|90.00|590.00|PEN|1.00||||1\n"
    ).encode("utf-8")


@pytest.fixture
def sire_compras_csv_empty() -> bytes:
    """Empty SIRE Compras CSV with only header."""
    return (
        "periodo|correlativo|fecha_emision|fecha_vcto_pago|tipo_comprobante|serie|numero|tipo_doc_proveedor|num_doc_proveedor|razon_social_proveedor|base_imponible|igv|total|moneda|tipo_cambio|referencia_fecha|referencia_tipo|referencia_serie|referencia_numero|estado\n"  # noqa: E501
    ).encode("utf-8")


@pytest.fixture
def sire_compras_csv_missing_igv() -> bytes:
    """SIRE Compras CSV with invoices missing IGV."""
    return (
        "periodo|correlativo|fecha_emision|fecha_vcto_pago|tipo_comprobante|serie|numero|tipo_doc_proveedor|num_doc_proveedor|razon_social_proveedor|base_imponible|igv|total|moneda|tipo_cambio|referencia_fecha|referencia_tipo|referencia_serie|referencia_numero|estado\n"  # noqa: E501
        "202501|0001|20250110|20250210|01|F001|0001|6|20123456789|PROVEEDOR UNO SAC|1000.00|0.00|1000.00|PEN|1.00||||1\n"
        "202501|0002|20250115|20250215|01|F001|0002|6|20123456789|PROVEEDOR UNO SAC|2000.00|360.00|2360.00|PEN|1.00||||1\n"
    ).encode("utf-8")


@pytest.fixture
def sire_compras_csv_invalid_ruc() -> bytes:
    """SIRE Compras CSV with an invalid (non-11-digit) RUC."""
    return (
        "periodo|correlativo|fecha_emision|fecha_vcto_pago|tipo_comprobante|serie|numero|tipo_doc_proveedor|num_doc_proveedor|razon_social_proveedor|base_imponible|igv|total|moneda|tipo_cambio|referencia_fecha|referencia_tipo|referencia_serie|referencia_numero|estado\n"  # noqa: E501
        "202501|0001|20250110|20250210|01|F001|0001|6|12345678|RUC CORTO SAC|1000.00|180.00|1180.00|PEN|1.00||||1\n"
        "202501|0002|20250115|20250215|01|F001|0002|6|20123456789|RUC VALIDO SAC|2000.00|360.00|2360.00|PEN|1.00||||1\n"
    ).encode("utf-8")


@pytest.fixture
def sire_compras_csv_invalid_data() -> bytes:
    """Malformed CSV that should trigger error handling."""
    return b"this is not a valid csv at all\n\n\ncorrupted"


@pytest.fixture
def sire_ventas_csv() -> bytes:
    """Sample SIRE Ventas CSV data (pipe-delimited, SUNAT format)."""
    return (
        "periodo|correlativo|fecha_emision|tipo_comprobante|serie|numero|tipo_doc_cliente|num_doc_cliente|razon_social_cliente|valor_exportacion|base_imponible|igv|total|moneda|tipo_cambio|estado\n"  # noqa: E501
        "202501|0001|20250115|01|F001|0001|6|20456789012|CLIENTE UNO SAC|0|5000.00|900.00|5900.00|PEN|1.00|1\n"
        "202501|0002|20250120|03|B001|0001|6|20567890123|CLIENTE DOS SA|0|3000.00|540.00|3540.00|PEN|1.00|1\n"
    ).encode("utf-8")


@pytest.fixture
def sire_ventas_csv_multiple_doc_types() -> bytes:
    """Ventas CSV with multiple document types."""
    return (
        "periodo|correlativo|fecha_emision|tipo_comprobante|serie|numero|tipo_doc_cliente|num_doc_cliente|razon_social_cliente|valor_exportacion|base_imponible|igv|total|moneda|tipo_cambio|estado\n"  # noqa: E501
        "202501|0001|20250115|01|F001|0001|6|20123456789|CLIENTE A|0|1000.00|180.00|1180.00|PEN|1.00|1\n"
        "202501|0002|20250120|01|F001|0002|6|20123456789|CLIENTE A|0|2000.00|360.00|2360.00|PEN|1.00|1\n"
        "202501|0003|20250125|03|B001|0001|6|20345678901|CLIENTE B|0|500.00|90.00|590.00|PEN|1.00|1\n"
        "202501|0004|20250130|07|FC01|0001|6|20456789012|CLIENTE C|0|8000.00|1440.00|9440.00|PEN|1.00|1\n"
    ).encode("utf-8")


# ── Cashflow analyzer fixtures ─────────────────────────────────────────────

@pytest.fixture
def cashflow_transactions() -> List[Dict[str, Any]]:
    """Sample transactions for cashflow analysis spanning multiple months."""
    return [
        {"date": "2025-01-05", "type": "INCOME", "amount": 10000.00, "category": "ventas"},
        {"date": "2025-01-07", "type": "EXPENSE", "amount": 3000.00, "category": "planilla"},
        {"date": "2025-01-10", "type": "EXPENSE", "amount": 1500.00, "category": "servicios"},
        {"date": "2025-01-15", "type": "INCOME", "amount": 5000.00, "category": "ventas"},
        {"date": "2025-01-20", "type": "EXPENSE", "amount": 2000.00, "category": "proveedores"},
        {"date": "2025-02-05", "type": "INCOME", "amount": 12000.00, "category": "ventas"},
        {"date": "2025-02-10", "type": "EXPENSE", "amount": 3200.00, "category": "planilla"},
        {"date": "2025-02-15", "type": "INCOME", "amount": 3000.00, "category": "servicios"},
        {"date": "2025-02-20", "type": "EXPENSE", "amount": 1800.00, "category": "servicios"},
    ]


@pytest.fixture
def cashflow_transactions_empty() -> List[Dict[str, Any]]:
    """Empty transactions list."""
    return []


@pytest.fixture
def cashflow_insufficient_forecast() -> List[Dict[str, Any]]:
    """Too few transactions for forecast (need ≥7)."""
    return [
        {"date": "2025-01-05", "type": "INCOME", "amount": 1000.00, "category": "ventas"},
        {"date": "2025-01-06", "type": "EXPENSE", "amount": 500.00, "category": "planilla"},
    ]


@pytest.fixture
def cashflow_single_type() -> List[Dict[str, Any]]:
    """Only income transactions (edge case)."""
    return [
        {"date": "2025-01-01", "type": "INCOME", "amount": 5000.00, "category": "ventas"},
        {"date": "2025-01-02", "type": "INCOME", "amount": 3000.00, "category": "ventas"},
        {"date": "2025-01-03", "type": "INCOME", "amount": 2000.00, "category": "ventas"},
    ]


# ── Banking analyzer fixtures ───────────────────────────────────────────────

@pytest.fixture
def bank_transactions() -> List[Dict[str, Any]]:
    """Sample bank statement entries."""
    return [
        {"date": "2025-01-10", "description": "TRANSFERENCIA CLIENTE A", "debit": 0.0, "credit": 5000.00, "balance": 15000.00, "net_amount": 5000.00},
        {"date": "2025-01-12", "description": "PAGO PROVEEDOR X", "debit": 2500.00, "credit": 0.0, "balance": 12500.00, "net_amount": -2500.00},
        {"date": "2025-01-15", "description": "DEPOSITO EFECTIVO", "debit": 0.0, "credit": 3000.00, "balance": 15500.00, "net_amount": 3000.00},
        {"date": "2025-01-20", "description": "TRANSFERENCIA CLIENTE B", "debit": 0.0, "credit": 8000.00, "balance": 23500.00, "net_amount": 8000.00},
        {"date": "2025-01-25", "description": "PAGO PLANILLA", "debit": 3200.00, "credit": 0.0, "balance": 20300.00, "net_amount": -3200.00},
    ]


@pytest.fixture
def system_transactions() -> List[Dict[str, Any]]:
    """Sample system-recorded transactions for reconciliation."""
    return [
        {"id": "SYS001", "date": "2025-01-10", "description": "Pago Cliente A", "amount": 5000.00},
        {"id": "SYS002", "date": "2025-01-12", "description": "Pago Proveedor X", "amount": -2500.00},
        {"id": "SYS003", "date": "2025-01-15", "description": "Deposito Efectivo", "amount": 3000.00},
        {"id": "SYS004", "date": "2025-01-26", "description": "Pago Planilla", "amount": -3200.00},  # 1 day off
    ]


@pytest.fixture
def bank_transactions_empty() -> List[Dict[str, Any]]:
    """Empty bank transactions."""
    return []


@pytest.fixture
def bank_transactions_minimal() -> List[Dict[str, Any]]:
    """Minimal bank data for pattern analysis."""
    # 4 recurring transactions at ~500 each → pattern detection threshold is 3
    return [
        {"date": "2025-01-05", "description": "SUSCRIPCION MENSUAL", "net_amount": -49.99, "debit": 49.99, "credit": 0.0, "balance": 1000.00},
        {"date": "2025-02-05", "description": "SUSCRIPCION MENSUAL", "net_amount": -49.99, "debit": 49.99, "credit": 0.0, "balance": 950.00},
        {"date": "2025-03-05", "description": "SUSCRIPCION MENSUAL", "net_amount": -49.99, "debit": 49.99, "credit": 0.0, "balance": 900.00},
        {"date": "2025-01-10", "description": "INGRESO EVENTUAL", "net_amount": 1000.00, "debit": 0.0, "credit": 1000.00, "balance": 2000.00},
    ]
