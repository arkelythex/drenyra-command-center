"""
Pydantic v2 schemas for OCR service.
Mirrors the TypeScript Zod schemas from packages/infrastructure/src/services/python-ocr/types.ts
"""

from pydantic import BaseModel, Field


class OCRResult(BaseModel):
    """Result of a single OCR extraction."""

    text: str
    confidence: float = Field(ge=0.0, le=1.0)
    language: str
    processing_time_ms: float


class InvoiceField(BaseModel):
    """A single extracted invoice field with confidence."""

    value: str
    confidence: float = Field(ge=0.0, le=1.0)
    bounding_box: list[float] | None = None


class InvoiceData(BaseModel):
    """Structured invoice data extracted from an image."""

    ruc: InvoiceField | None = None
    razon_social: InvoiceField | None = None
    tipo_documento: InvoiceField | None = None
    serie_numero: InvoiceField | None = None
    fecha_emision: InvoiceField | None = None
    fecha_vencimiento: InvoiceField | None = None
    subtotal: InvoiceField | None = None
    igv: InvoiceField | None = None
    total: InvoiceField | None = None
    moneda: InvoiceField | None = None
    raw_text: str = ""
    overall_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    needs_review: bool = False
    warnings: list[str] = Field(default_factory=list)


class BatchResult(BaseModel):
    """Result of batch OCR processing."""

    total: int
    successful: int
    failed: int
    results: list[OCRResult | None]

    model_config = {"json_schema_extra": {"example": {"total": 3, "successful": 2, "failed": 1, "results": []}}}


class PDFExtractResult(BaseModel):
    """Result of PDF text extraction."""

    text: str
    page_count: int
    has_images: bool
    metadata: dict[str, object]


class InvoiceItem(BaseModel):
    """A single line item from a SUNAT invoice."""

    descripcion: str | None = None
    cantidad: float | None = None
    unit: str | None = None
    precio_unitario_cents: int | None = None
    total_cents: int | None = None


class XMLParseResult(BaseModel):
    """Result of SUNAT XML invoice parsing."""

    emisor_ruc: str | None = None
    emisor_razon_social: str | None = None
    receptor_ruc: str | None = None
    receptor_razon_social: str | None = None
    tipo_documento: str | None = None
    serie: str | None = None
    numero: str | None = None
    fecha_emision: str | None = None
    subtotal_cents: int | None = None
    igv_cents: int | None = None
    total_cents: int | None = None
    moneda: str | None = None
    items: list[InvoiceItem] = Field(default_factory=list)
    is_valid: bool = False
    validation_errors: list[str] = Field(default_factory=list)


class ClassificationResult(BaseModel):
    """Result of document type classification."""

    document_type: str
    confidence: float = Field(ge=0.0, le=1.0)
    suggested_action: str
