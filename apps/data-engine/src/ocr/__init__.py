"""
OCR service package for Arkelythex Data Engine.
Provides PP-OCRv6 image text extraction, invoice data parsing, PDF extraction,
SUNAT XML parsing, and document classification.
"""

from src.ocr.router import documents_router, ocr_router

__all__ = [
    "documents_router",
    "ocr_router",
]
