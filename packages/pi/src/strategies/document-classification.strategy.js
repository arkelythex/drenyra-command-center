export const DEFAULT_MIN_CONFIDENCE = 0.5;
export const MIN_UNREADABLE_CHARS = 20;
export const DOCUMENT_TYPE_KEYWORDS = {
    invoice: [
        {
            keywords: ["FACTURA", "FACTURA ELECTRÓNICA", "BOLETA DE VENTA"],
            weight: 1.0,
        },
        { keywords: ["RUC", "IGV", "SUBTOTAL", "TOTAL"], weight: 0.8 },
        { keywords: ["SERIE", "CORRELATIVO", "CPE"], weight: 0.6 },
    ],
    receipt: [
        { keywords: ["TICKET", "VOUCHER", "BOLETA"], weight: 1.0 },
        { keywords: ["VUELTO", "CAJA", "GRACIAS POR SU COMPRA"], weight: 0.8 },
    ],
    identity: [
        { keywords: ["DNI", "DOCUMENTO NACIONAL DE IDENTIDAD"], weight: 1.0 },
        { keywords: ["NOMBRE", "APELLIDOS", "LUGAR DE NACIMIENTO"], weight: 0.7 },
    ],
    contract: [
        { keywords: ["CONTRATO", "CLAUSULA", "PARTES", "FIRMA"], weight: 1.0 },
    ],
    bank_statement: [
        { keywords: ["EXTRACTO", "MOVIMIENTOS", "ESTADO DE CUENTA"], weight: 1.0 },
        { keywords: ["BANCO", "CUENTA", "SALDO"], weight: 0.8 },
    ],
    sunat_xml: [
        {
            keywords: ["UBL", "SUNAT", "cbc:Invoice", "cac:InvoiceLine"],
            weight: 1.0,
        },
        { keywords: ["IssueDate", "InvoiceTypeCode", "cbc:ID"], weight: 0.8 },
    ],
    unknown: [],
};
export const SUNAT_SERIES_PATTERNS = {
    F: "FACTURA",
    B: "BOLETA",
    FC: "FACTURA (Comercial)",
    BC: "BOLETA (Comercial)",
    E: "NOTA_CREDITO_FACTURA",
    EB: "NOTA_CREDITO_BOLETA",
    FD: "NOTA_DEBITO_FACTURA",
    BD: "NOTA_DEBITO_BOLETA",
    P: "PROFORMA",
    R: "RECIBO",
};
export const REQUIRED_FIELDS = {
    invoice: ["RUC", "serie", "correlativo", "total", "igv"],
    receipt: ["total", "fecha"],
    identity: ["nombres", "apellidos", "documento"],
    contract: ["partes", "clausula", "fecha"],
    bank_statement: ["banco", "cuenta", "saldo", "movimientos"],
    sunat_xml: ["UBL", "emisor", "receptor", "tipo", "monto"],
    unknown: [],
};
function detectFormat(filename) {
    if (!filename)
        return "UNKNOWN";
    const ext = filename.toLowerCase().split(".").pop() ?? "";
    switch (ext) {
        case "xml":
            return "XML";
        case "pdf":
            return "PDF";
        case "png":
        case "jpg":
        case "jpeg":
        case "tiff":
        case "bmp":
        case "webp":
            return "IMAGE";
        default:
            return "UNKNOWN";
    }
}
function detectSunatType(serie, text) {
    if (serie) {
        const prefix = serie.match(/^([A-Z]+)/)?.[1];
        if (prefix) {
            const matches = Object.entries(SUNAT_SERIES_PATTERNS)
                .filter(([key]) => prefix.startsWith(key))
                .sort(([a], [b]) => b.length - a.length);
            if (matches.length > 0) {
                return { type: matches[0][1], confidence: 0.9 };
            }
        }
    }
    if (text) {
        const upper = text.toUpperCase();
        if (upper.includes("FACTURA"))
            return { type: "FACTURA", confidence: 0.6 };
        if (upper.includes("BOLETA"))
            return { type: "BOLETA", confidence: 0.6 };
    }
    return undefined;
}
function classifyByContent(text) {
    const upper = text.toUpperCase();
    const scores = [];
    for (const [type, groups] of Object.entries(DOCUMENT_TYPE_KEYWORDS)) {
        if (type === "unknown")
            continue;
        let totalScore = 0;
        let totalWeight = 0;
        let matchedKeywords = 0;
        for (const group of groups) {
            totalWeight += group.weight;
            const matchCount = group.keywords.filter((kw) => upper.includes(kw)).length;
            if (matchCount > 0) {
                totalScore += (matchCount / group.keywords.length) * group.weight;
                matchedKeywords += matchCount;
            }
        }
        if (totalWeight > 0) {
            const normalizedScore = totalScore / totalWeight;
            scores.push({
                type: type,
                score: normalizedScore,
                matchedKeywords,
            });
        }
    }
    if (scores.length === 0) {
        return { type: "unknown", confidence: 0, method: "no_keywords_matched" };
    }
    scores.sort((a, b) => b.score - a.score);
    if (scores[0].score === 0) {
        return { type: "unknown", confidence: 0, method: "no_keywords_matched" };
    }
    if (scores.length > 1 && scores[0].score > scores[1].score * 1.5) {
        return {
            type: scores[0].type,
            confidence: scores[0].score,
            method: "keyword_match",
        };
    }
    return {
        type: scores[0].type,
        confidence: scores[0].score * 0.7,
        method: "keyword_match_low_confidence",
    };
}
function checkCompleteness(type, text) {
    const fields = REQUIRED_FIELDS[type];
    if (fields.length === 0)
        return { score: 1, missing: [] };
    const upper = text.toUpperCase();
    const missing = fields.filter((field) => !upper.includes(field.toUpperCase()));
    const score = (fields.length - missing.length) / fields.length;
    return { score, missing };
}
function generateDocAnomalyId(type, idx) {
    return `doc-cls-${type}-${Date.now()}-${idx}`;
}
export function classifyDocument(doc, options) {
    const opts = {
        minConfidence: options?.minConfidence ?? DEFAULT_MIN_CONFIDENCE,
        checkFormat: options?.checkFormat ?? true,
        classifyByContent: options?.classifyByContent ?? true,
        checkCompleteness: options?.checkCompleteness ?? true,
        checkTypeMismatch: options?.checkTypeMismatch ?? true,
    };
    const anomalies = [];
    const timestamp = new Date().toISOString();
    const format = opts.checkFormat ? detectFormat(doc.filename) : "UNKNOWN";
    const sunatInfo = detectSunatType(doc.serie, doc.text);
    let detectedType = "unknown";
    let confidence = 0;
    let classificationMethod = "format_only";
    if (format === "XML" && sunatInfo) {
        detectedType = "sunat_xml";
        confidence = 0.95;
        classificationMethod = "xml_format_with_sunat_type";
    }
    else if (format === "XML" && doc.text.includes("UBL")) {
        detectedType = "sunat_xml";
        confidence = 0.85;
        classificationMethod = "xml_format_with_ubl";
    }
    else if (opts.classifyByContent && doc.text.length > MIN_UNREADABLE_CHARS) {
        const contentResult = classifyByContent(doc.text);
        detectedType = contentResult.type;
        confidence = contentResult.confidence;
        classificationMethod = contentResult.method;
    }
    else if (doc.text.length <= MIN_UNREADABLE_CHARS && doc.text.length > 0) {
        detectedType = "unknown";
        confidence = 0.1;
        classificationMethod = "unreadable";
    }
    if (doc.text.length <= MIN_UNREADABLE_CHARS && doc.text.length > 0) {
        anomalies.push({
            id: generateDocAnomalyId("unreadable", anomalies.length),
            timestamp,
            entityType: "document",
            entityId: doc.id,
            metric: "text_length",
            expectedValue: MIN_UNREADABLE_CHARS,
            actualValue: doc.text.length,
            deviation: MIN_UNREADABLE_CHARS - doc.text.length,
            severity: "medium",
            confidence: 0.8,
            reasoning: `Document text has only ${doc.text.length} characters (minimum ${MIN_UNREADABLE_CHARS} for reliable classification)`,
            detectionMethod: "content_length_check",
            context: { filename: doc.filename, textLength: doc.text.length },
        });
    }
    if (detectedType === "unknown" && confidence < opts.minConfidence) {
        anomalies.push({
            id: generateDocAnomalyId("not_classified", anomalies.length),
            timestamp,
            entityType: "document",
            entityId: doc.id,
            metric: "classification_confidence",
            expectedValue: opts.minConfidence,
            actualValue: confidence,
            deviation: opts.minConfidence - confidence,
            severity: "high",
            confidence: 0.9,
            reasoning: `Document could not be classified (confidence ${(confidence * 100).toFixed(0)}%, minimum ${(opts.minConfidence * 100).toFixed(0)}%)`,
            detectionMethod: "content_classification",
            context: {
                filename: doc.filename,
                format,
                textPreview: doc.text.slice(0, 100),
            },
        });
    }
    let completenessScore = 0;
    let missingFields = [];
    if (opts.checkCompleteness && detectedType !== "unknown") {
        const completeness = checkCompleteness(detectedType, doc.text);
        completenessScore = completeness.score;
        missingFields = completeness.missing;
        if (completeness.missing.length > 0) {
            const severity = completeness.missing.length >= 3
                ? "high"
                : completeness.missing.length >= 2
                    ? "medium"
                    : "low";
            anomalies.push({
                id: generateDocAnomalyId("missing_fields", anomalies.length),
                timestamp,
                entityType: "document",
                entityId: doc.id,
                metric: "completeness_score",
                expectedValue: 1,
                actualValue: completenessScore,
                deviation: 1 - completenessScore,
                severity,
                confidence: 0.75,
                reasoning: `Document classified as ${detectedType} but missing fields: ${completeness.missing.join(", ")}`,
                detectionMethod: "completeness_check",
                context: {
                    filename: doc.filename,
                    detectedType,
                    missingFields: completeness.missing,
                },
            });
        }
    }
    if (opts.checkTypeMismatch &&
        doc.declaredType &&
        detectedType !== "unknown") {
        if (doc.declaredType !== detectedType) {
            anomalies.push({
                id: generateDocAnomalyId("type_mismatch", anomalies.length),
                timestamp,
                entityType: "document",
                entityId: doc.id,
                metric: "type_match",
                expectedValue: 1,
                actualValue: 0,
                deviation: 1,
                severity: "medium",
                confidence: 0.85,
                reasoning: `Declared type "${doc.declaredType}" does not match detected type "${detectedType}"`,
                detectionMethod: "type_mismatch_check",
                context: {
                    filename: doc.filename,
                    declaredType: doc.declaredType,
                    detectedType,
                },
            });
        }
    }
    const result = {
        documentId: doc.id,
        detectedType,
        detectedFormat: format,
        sunatType: sunatInfo?.type,
        confidence,
        completenessScore,
        missingFields,
        classificationMethod,
    };
    return { result, anomalies };
}
export function classifyDocuments(documents, options) {
    const allAnomalies = [];
    const results = [];
    for (const doc of documents) {
        const { result, anomalies } = classifyDocument(doc, options);
        results.push(result);
        allAnomalies.push(...anomalies);
    }
    return { results, anomalies: allAnomalies };
}
export function createDocumentClassificationStrategy(options) {
    return {
        id: "document-classification",
        name: "Document Classification",
        description: "Classifies fiscal documents by type, format, and SUNAT series. " +
            "Detects: unclassifiable documents, missing required fields, type mismatches, unreadable content.",
        minSeverity: "low",
        execute(data) {
            const documents = data;
            if (!Array.isArray(documents) || documents.length === 0) {
                return [];
            }
            const { anomalies } = classifyDocuments(documents, options);
            return anomalies;
        },
    };
}
//# sourceMappingURL=document-classification.strategy.js.map