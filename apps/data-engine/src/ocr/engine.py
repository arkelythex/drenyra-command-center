"""
PP-OCRv6 wrapper (PaddleOCR 3.7.0) for Arkelythex Data Engine.
Provides OCR, invoice extraction, PDF extraction, and document classification.
"""

from __future__ import annotations

import logging
import time
from typing import Optional

logger = logging.getLogger(__name__)


# ============================================
# Invoice field pattern matching
# ============================================

INVOICE_FIELD_PATTERNS: dict[str, list[str]] = {
    "ruc": ["RUC", "R.U.C.", "NRO RUC", "N\u00b0 RUC"],
    "razon_social": ["RAZON SOCIAL", "RAZ\u00d3N SOCIAL", "R.SOCIAL"],
    "tipo": ["FACTURA", "BOLETA", "TICKET", "NOTA DE CREDITO", "NOTA DE DEBITO", "COMPROBANTE"],
    "serie": ["SERIE", "N\u00b0 SERIE", "COMPROBANTE", "FACTURA N\u00b0", "BOLETA N\u00b0"],
    "fecha_emision": ["FECHA DE EMISION", "FECHA EMISION", "FECHA", "EMISI\u00d3N"],
    "fecha_vencimiento": ["FECHA DE VENCIMIENTO", "FECHA VENCIMIENTO", "VENCIMIENTO", "VTO"],
    "subtotal": ["SUBTOTAL", "SUB TOTAL", "BASE IMPONIBLE", "VALOR VENTA", "OP. GRAVADAS"],
    "igv": ["IGV", "I.G.V.", "18%"],
    "total": ["TOTAL", "IMPORTE TOTAL", "TOTAL A PAGAR", "PAGAR"],
    "moneda": ["SOLES", "DOLARES", "USD", "PEN", "MONEDA"],
}

# Document type classification hints
DOCUMENT_TYPE_PATTERNS: dict[str, list[str]] = {
    "invoice": ["FACTURA", "BOLETA", "RUC", "IGV", "SUBTOTAL", "TOTAL"],
    "receipt": ["TICKET", "VUELTO", "CAJA", "GRACIAS POR SU COMPRA"],
    "identity": ["DNI", "DOCUMENTO NACIONAL DE IDENTIDAD", "NOMBRE", "APELLIDOS", "LUGAR DE NACIMIENTO"],
    "contract": ["CONTRATO", "CLAUSULA", "PARTES", "FIRMA"],
    "bank_statement": ["EXTRACTO", "MOVIMIENTOS", "CUENTA", "BANCO", "SALDO"],
}


class PPOcrEngine:
    """PP-OCRv6 wrapper — PaddleOCR 3.7.0.

    Singleton pattern — only one instance ever created.
    Lazy initialization — PaddleOCR is imported and loaded on first call.
    """

    _instance: Optional["PPOcrEngine"] = None

    def __new__(cls, *args: object, **kwargs: object) -> "PPOcrEngine":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False  # type: ignore[attr-defined]
        return cls._instance

    def __init__(self, model_tier: str = "medium", use_gpu: bool = False) -> None:
        if getattr(self, "_initialized", False):
            return
        self._initialized = True
        self.model_tier = model_tier
        self.use_gpu = use_gpu
        self._ocr: object = None
        self._structure: object = None
        self._initialized_internal = False

    def initialize(self) -> None:
        """Lazy initialization — imports paddleocr only when first called."""
        if self._initialized_internal:
            return
        try:
            from paddleocr import PaddleOCR, PPStructure  # type: ignore[import-untyped]

            self._ocr = PaddleOCR(
                use_angle_cls=True,
                lang="ch",  # ch handles Chinese + English + numbers
                use_gpu=self.use_gpu,
                det_db_thresh=0.3,
                det_db_box_thresh=0.5,
                rec_batch_num=6,
                show_log=False,
            )

            self._structure = PPStructure(
                lang="ch",
                use_gpu=self.use_gpu,
                show_log=False,
            )

            logger.info(
                "PP-OCRv6 initialized (tier=%s, gpu=%s)",
                self.model_tier,
                self.use_gpu,
            )
            self._initialized_internal = True
        except ImportError as e:
            logger.error("Failed to import paddleocr: %s", e)
            raise

    def extract_text(self, image_bytes: bytes) -> dict:
        """Extract all text from an image with confidence.

        Args:
            image_bytes: Raw image bytes (JPEG, PNG, etc.).

        Returns:
            dict with text, confidence (0-1), language, processing_time_ms.
        """
        self.initialize()
        import cv2
        import numpy as np

        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {
                "text": "",
                "confidence": 0.0,
                "language": "unknown",
                "processing_time_ms": 0.0,
            }

        start = time.monotonic()
        result = self._ocr.ocr(img, cls=True)  # type: ignore[union-attr]
        elapsed = (time.monotonic() - start) * 1000

        if not result or not result[0]:
            return {
                "text": "",
                "confidence": 0.0,
                "language": "unknown",
                "processing_time_ms": elapsed,
            }

        lines: list[str] = []
        confidences: list[float] = []
        for line in result[0]:
            _, (text, confidence) = line
            lines.append(text)
            confidences.append(float(confidence))

        return {
            "text": "\n".join(lines),
            "confidence": float(np.mean(confidences)) if confidences else 0.0,
            "language": "es",
            "processing_time_ms": elapsed,
        }

    def extract_invoice(self, image_bytes: bytes) -> dict:
        """Extract structured invoice data from an image.

        Uses OCR for full text extraction + PPStructure for layout analysis,
        then matches fields against INVOICE_FIELD_PATTERNS.

        Args:
            image_bytes: Raw image bytes.

        Returns:
            dict with structured invoice fields, raw_text, overall_confidence,
            needs_review, warnings.
        """
        self.initialize()
        import cv2
        import numpy as np

        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return self._empty_invoice_result("Could not decode image")

        start = time.monotonic()
        ocr_result = self._ocr.ocr(img, cls=True)  # type: ignore[union-attr]

        # Structure analysis (layout detection)
        try:
            struct_result = self._structure(img)  # type: ignore[union-attr]
        except Exception:
            struct_result = []
            logger.debug("PPStructure analysis failed, falling back to flat OCR")

        _ = elapsed = (time.monotonic() - start) * 1000  # noqa: F841

        raw_lines: list[str] = []
        invoice_fields: dict[str, dict] = {}
        overall_confidences: list[float] = []

        if ocr_result and ocr_result[0]:
            for line in ocr_result[0]:
                bbox, (text, confidence) = line
                raw_lines.append(text)
                confidence_f = float(confidence)
                overall_confidences.append(confidence_f)

                # Try to match field patterns
                text_upper = text.upper().strip()
                for field_name, patterns in INVOICE_FIELD_PATTERNS.items():
                    for pattern in patterns:
                        if pattern in text_upper:
                            # Extract value after the field name
                            value = text_upper.replace(pattern, "").strip().rstrip(":")
                            if value and field_name not in invoice_fields:
                                invoice_fields[field_name] = {
                                    "value": text.strip(),
                                    "confidence": confidence_f,
                                    "bounding_box": [float(x) for x in sum(bbox, [])],
                                }
                            break

        overall_conf = float(np.mean(overall_confidences)) if overall_confidences else 0.0

        def get_field(field_name: str) -> dict | None:
            return invoice_fields.get(field_name)

        return {
            "ruc": get_field("ruc"),
            "razon_social": get_field("razon_social"),
            "tipo_documento": get_field("tipo"),
            "serie_numero": get_field("serie"),
            "fecha_emision": get_field("fecha_emision"),
            "fecha_vencimiento": get_field("fecha_vencimiento"),
            "subtotal": get_field("subtotal"),
            "igv": get_field("igv"),
            "total": get_field("total"),
            "moneda": get_field("moneda"),
            "raw_text": "\n".join(raw_lines),
            "overall_confidence": overall_conf,
            "needs_review": overall_conf < 0.5,
            "warnings": [] if overall_conf >= 0.5 else ["Low confidence, manual review recommended"],
        }

    def extract_pdf(self, pdf_bytes: bytes) -> dict:
        """Extract text from a PDF document.

        Tries direct text extraction first, falls back to OCR for scanned pages.

        Args:
            pdf_bytes: Raw PDF file bytes.

        Returns:
            dict with text, page_count, has_images, metadata.
        """
        self.initialize()
        try:
            import fitz  # PyMuPDF  # type: ignore[import-untyped]
        except ImportError:
            return {
                "text": "PDF extraction requires PyMuPDF (pip install PyMuPDF)",
                "page_count": 0,
                "has_images": False,
                "metadata": {},
            }

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        all_text: list[str] = []
        has_images = False
        page_count = len(doc)

        for page_num in range(page_count):
            page = doc[page_num]

            # Try direct text extraction first
            text = page.get_text()

            if text.strip():
                all_text.append(text)
            else:
                # OCR scanned page
                pix = page.get_pixmap(dpi=300)
                img_bytes = pix.tobytes("png")
                result = self.extract_text(img_bytes)
                if result["text"]:
                    all_text.append(f"[Page {page_num + 1}]\n{result['text']}")
                has_images = True

            # Check for embedded images
            image_list = page.get_images()
            if image_list:
                has_images = True

        doc.close()

        return {
            "text": "\n\n".join(all_text),
            "page_count": page_count,
            "has_images": has_images,
            "metadata": {},
        }

    def classify_document(self, image_bytes: bytes, filename: str = "") -> dict:
        """Classify a document image by type.

        Uses OCR text + heuristic pattern matching to determine document type.

        Args:
            image_bytes: Raw image bytes.
            filename: Original filename (used for extension-based hints).

        Returns:
            dict with document_type, confidence, suggested_action.
        """
        # Extension-based fast path
        ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
        if ext == "pdf":
            return {
                "document_type": "pdf_document",
                "confidence": 0.9,
                "suggested_action": "extract_text",
            }
        if ext == "xml":
            return {
                "document_type": "sunat_xml",
                "confidence": 0.95,
                "suggested_action": "parse_invoice",
            }

        # OCR-based classification for images
        self.initialize()
        import cv2
        import numpy as np

        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {
                "document_type": "unknown",
                "confidence": 0.0,
                "suggested_action": "manual_review",
            }

        result = self._ocr.ocr(img, cls=True)  # type: ignore[union-attr]

        if not result or not result[0]:
            return {
                "document_type": "unknown",
                "confidence": 0.0,
                "suggested_action": "manual_review",
            }

        # Collect all recognized text
        all_text = " ".join(line[1][0] for line in result[0] if line[1][0])

        # Score each document type
        scores: dict[str, int] = {}
        for doc_type, patterns in DOCUMENT_TYPE_PATTERNS.items():
            scores[doc_type] = sum(1 for p in patterns if p in all_text.upper())

        if not scores or max(scores.values()) == 0:
            return {
                "document_type": "unknown",
                "confidence": 0.0,
                "suggested_action": "ocr_extract",
            }

        best_type = max(scores, key=scores.get)  # type: ignore[arg-type]
        best_score = scores[best_type]
        max_possible = len(DOCUMENT_TYPE_PATTERNS[best_type])

        action_map: dict[str, str] = {
            "invoice": "extract_invoice",
            "receipt": "ocr_extract",
            "identity": "ocr_extract",
            "contract": "ocr_extract",
            "bank_statement": "parse_statement",
        }

        return {
            "document_type": best_type,
            "confidence": round(best_score / max_possible, 2) if max_possible > 0 else 0.0,
            "suggested_action": action_map.get(best_type, "ocr_extract"),
        }

    # ============================================
    # Private helpers
    # ============================================

    @staticmethod
    def _empty_invoice_result(reason: str) -> dict:
        return {
            "ruc": None,
            "razon_social": None,
            "tipo_documento": None,
            "serie_numero": None,
            "fecha_emision": None,
            "fecha_vencimiento": None,
            "subtotal": None,
            "igv": None,
            "total": None,
            "moneda": None,
            "raw_text": "",
            "overall_confidence": 0.0,
            "needs_review": True,
            "warnings": [reason],
        }
