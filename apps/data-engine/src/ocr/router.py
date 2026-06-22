"""
FastAPI routers for OCR and document processing.
Endpoints mirror the TypeScript PythonOCRClient expectations.

OCR endpoints: /v1/ocr/extract, /v1/ocr/extract-invoice, /v1/ocr/batch
Document endpoints: /v1/documents/pdf/extract, /v1/documents/xml/parse, /v1/documents/classify
"""

from __future__ import annotations

import logging
import time
import xml.etree.ElementTree as ET
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from src.ocr.engine import PPOcrEngine
from src.ocr.schemas import (
    BatchResult,
    ClassificationResult,
    InvoiceData,
    InvoiceField,
    InvoiceItem,
    OCRResult,
    PDFExtractResult,
    XMLParseResult,
)

logger = logging.getLogger(__name__)

# Shared engine instance (singleton)
engine = PPOcrEngine()

# ==========================================
# OCR Router  — /v1/ocr/*
# ==========================================

ocr_router = APIRouter()


@ocr_router.post(
    "/extract",
    response_model=OCRResult,
    summary="Extract text from an image",
)
async def extract_text(file: UploadFile = File(...)) -> OCRResult:
    """Extract all text from an uploaded image via PP-OCRv6."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image (JPEG, PNG, etc.)",
        )

    try:
        image_bytes = await file.read()
        result = engine.extract_text(image_bytes)
        return OCRResult(**result)
    except ImportError as e:
        logger.error("OCR engine not available: %s", e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"OCR engine not available: {e}",
        )
    except Exception as e:
        logger.exception("Text extraction failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text extraction failed: {e}",
        )


@ocr_router.post(
    "/extract-invoice",
    response_model=InvoiceData,
    summary="Extract structured invoice data from an image",
)
async def extract_invoice(file: UploadFile = File(...)) -> InvoiceData:
    """Extract structured invoice fields (RUC, total, IGV, etc.) from an image."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image (JPEG, PNG, etc.)",
        )

    try:
        image_bytes = await file.read()
        result = engine.extract_invoice(image_bytes)
        return InvoiceData(**result)
    except ImportError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"OCR engine not available: {e}",
        )
    except Exception as e:
        logger.exception("Invoice extraction failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Invoice extraction failed: {e}",
        )


@ocr_router.post(
    "/batch",
    response_model=BatchResult,
    summary="Process multiple images in batch",
)
async def batch_extract(files: list[UploadFile] = File(...)) -> BatchResult:
    """Process multiple image files and return OCR results for each."""
    results: list[OCRResult | None] = []
    successful = 0
    failed = 0

    for f in files:
        try:
            image_bytes = await f.read()
            raw = engine.extract_text(image_bytes)
            results.append(OCRResult(**raw))
            successful += 1
        except Exception:
            logger.warning("Batch item failed: %s", f.filename)
            results.append(None)
            failed += 1

    return BatchResult(
        total=len(files),
        successful=successful,
        failed=failed,
        results=results,
    )


# ==========================================
# Document Router — /v1/documents/*
# ==========================================

documents_router = APIRouter()


@documents_router.post(
    "/pdf/extract",
    response_model=PDFExtractResult,
    summary="Extract text from a PDF document",
)
async def extract_pdf(file: UploadFile = File(...)) -> PDFExtractResult:
    """Extract text from an uploaded PDF. Falls back to OCR for scanned pages."""
    if file.content_type and file.content_type != "application/pdf":
        # Accept .pdf extension as override
        if not (file.filename and file.filename.lower().endswith(".pdf")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be a PDF",
            )

    try:
        pdf_bytes = await file.read()
        result = engine.extract_pdf(pdf_bytes)
        return PDFExtractResult(**result)
    except ImportError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"PDF extraction not available: {e}",
        )
    except Exception as e:
        logger.exception("PDF extraction failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF extraction failed: {e}",
        )


@documents_router.post(
    "/xml/parse",
    response_model=XMLParseResult,
    summary="Parse a SUNAT XML invoice",
)
async def parse_xml(file: UploadFile = File(...)) -> XMLParseResult:
    """Parse a SUNAT UBL 2.1 XML invoice and extract structured fields."""
    try:
        content = await file.read()
        return _parse_sunat_xml(content)
    except ET.ParseError as e:
        return XMLParseResult(
            is_valid=False,
            validation_errors=[f"XML parse error: {e}"],
        )
    except Exception as e:
        logger.exception("XML parsing failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"XML parsing failed: {e}",
        )


@documents_router.post(
    "/classify",
    response_model=ClassificationResult,
    summary="Classify a document by type",
)
async def classify_document(file: UploadFile = File(...)) -> ClassificationResult:
    """Classify an uploaded document (invoice, receipt, identity, etc.)."""
    try:
        image_bytes = await file.read()
        filename = file.filename or ""
        result = engine.classify_document(image_bytes, filename)
        return ClassificationResult(**result)
    except ImportError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Classification engine not available: {e}",
        )
    except Exception as e:
        logger.exception("Document classification failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Classification failed: {e}",
        )


# ==========================================
# SUNAT XML parsing internals
# ==========================================


def _parse_sunat_xml(content: bytes) -> XMLParseResult:
    """Parse a SUNAT UBL 2.1 XML document.

    Uses namespace-aware extraction for standard SUNAT invoice fields.
    """
    namespaces = {
        "cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
        "cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
        "sac": "urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1",
        "ds": "http://www.w3.org/2000/09/xmldsig#",
    }

    root = ET.fromstring(content)

    def find_text(*path: str) -> str | None:
        """Find an element's text by tag path."""
        for p in path:
            el = root.find(p, namespaces)
            if el is not None and el.text:
                return el.text.strip()
        return None

    def find_all(*path: str) -> list[ET.Element]:
        """Find all matching elements."""
        for p in path:
            result = root.findall(p, namespaces)
            if result:
                return result
        return []

    # Extract header fields
    invoice_type_code = find_text(
        ".//cbc:InvoiceTypeCode",
        ".//cbc:DocumentTypeCode",
    )

    serie = find_text(
        ".//cbc:ID",
        ".//cbc:DocumentSerialID",
    )
    numero = find_text(".//cbc:ID")

    # Try to split serie-numero (e.g. "F001-00001234")
    if serie and numero:
        parts = numero.split("-")
        if len(parts) == 2:
            serie, numero = parts[0], parts[1]
        elif len(parts) == 1:
            # Serie is the first 4 chars
            serie, numero = serie[:4], serie[4:] if len(serie) > 4 else (serie, "")

    fecha_emision = find_text(
        ".//cbc:IssueDate",
        ".//cbc:IssueDateTime",
    )

    moneda = find_text(
        ".//cbc:DocumentCurrencyCode",
    )

    # Emisor (Supplier)
    emisor_ruc = find_text(
        ".//cac:AccountingSupplierParty/cac:Party/cac:PartyIdentification/cbc:ID",
    )
    emisor_razon_social = find_text(
        ".//cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName",
        ".//cac:AccountingSupplierParty/cac:Party/cac:PartyName/cbc:Name",
    )

    # Receptor (Customer)
    receptor_ruc = find_text(
        ".//cac:AccountingCustomerParty/cac:Party/cac:PartyIdentification/cbc:ID",
    )
    receptor_razon_social = find_text(
        ".//cac:AccountingCustomerParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName",
        ".//cac:AccountingCustomerParty/cac:Party/cac:PartyName/cbc:Name",
    )

    # Monetary totals (in cents)
    def extract_cents(*paths: str) -> int | None:
        val = find_text(*paths)
        if val is None:
            return None
        try:
            # SUNAT amounts are in PEN with 2 decimals
            return int(round(float(val) * 100))
        except (ValueError, TypeError):
            return None

    subtotal_cents = extract_cents(
        ".//cac:LegalMonetaryTotal/cbc:TaxExclusiveAmount",
        ".//cac:LegalMonetaryTotal/cbc:LineExtensionTotalAmount",
    )
    igv_cents = _extract_tax_total(root, namespaces)
    total_cents = extract_cents(
        ".//cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount",
        ".//cac:LegalMonetaryTotal/cbc:PayableAmount",
    )

    # Invoice items
    items: list[InvoiceItem] = []
    invoice_lines = find_all(
        ".//cac:InvoiceLine",
        ".//cac:CreditNoteLine",
        ".//cac:DebitNoteLine",
    )
    for line in invoice_lines:
        desc = find_text_from(line, namespaces, ".//cbc:Description", ".//cbc:ItemDescription")
        cantidad = find_text_from(line, namespaces, ".//cbc:InvoicedQuantity", ".//cbc:CreditedQuantity")
        unit = find_text_from(line, namespaces, ".//cbc:InvoicedQuantity/@unitCode")

        price = find_text_from(
            line, namespaces,
            ".//cac:Price/cbc:PriceAmount",
            ".//cac:UnitPrice/cbc:PriceAmount",
        )
        total_line = find_text_from(
            line, namespaces,
            ".//cbc:LineExtensionAmount",
            ".//cbc:TotalAmount",
        )

        items.append(
            InvoiceItem(
                descripcion=desc,
                cantidad=float(cantidad) if cantidad else None,
                unit=unit,
                precio_unitario_cents=int(round(float(price) * 100)) if price else None,
                total_cents=int(round(float(total_line) * 100)) if total_line else None,
            )
        )

    # Validation
    validation_errors: list[str] = []
    if not emisor_ruc:
        validation_errors.append("Missing emisor RUC")
    if not total_cents:
        validation_errors.append("Missing total amount")
    if not items:
        validation_errors.append("No invoice lines found")

    return XMLParseResult(
        emisor_ruc=emisor_ruc,
        emisor_razon_social=emisor_razon_social,
        receptor_ruc=receptor_ruc,
        receptor_razon_social=receptor_razon_social,
        tipo_documento=invoice_type_code,
        serie=serie,
        numero=numero,
        fecha_emision=fecha_emision,
        subtotal_cents=subtotal_cents,
        igv_cents=igv_cents,
        total_cents=total_cents,
        moneda=moneda,
        items=items,
        is_valid=len(validation_errors) == 0,
        validation_errors=validation_errors,
    )


def _extract_tax_total(root: ET.Element, namespaces: dict[str, str]) -> int | None:
    """Extract IGV total from TaxTotal section."""
    tax_totals = root.findall(".//cac:TaxTotal", namespaces)
    for tax_total in tax_totals:
        tax_amount_el = tax_total.find("cbc:TaxAmount", namespaces)
        if tax_amount_el is not None and tax_amount_el.text:
            try:
                return int(round(float(tax_amount_el.text) * 100))
            except (ValueError, TypeError):
                pass
    return None


def find_text_from(
    element: ET.Element,
    namespaces: dict[str, str],
    *paths: str,
) -> str | None:
    """Find text from an element using namespace-prefixed paths."""
    for p in paths:
        el = element.find(p, namespaces)
        if el is not None and el.text:
            return el.text.strip()
    return None
