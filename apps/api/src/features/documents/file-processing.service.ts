import { UBLParser } from "@drenyra/infrastructure/xml/ubl-parser";
import { hasUnsafeXmlDeclarations } from "./security.utils";

const MAX_XML_PARSE_BYTES = 2 * 1024 * 1024;

/**
 * ParsedXmlInvoiceData interface.
 *
 * @example
 * ```ts
 * const value: ParsedXmlInvoiceData = {} as ParsedXmlInvoiceData;
 * console.log(value);
 * ```
 */
export interface ParsedXmlInvoiceData {
	providerRUC: string;
	providerName: string;
	issueDate: string;
	documentNumber: string;
	baseAmount: number;
	igvAmount: number;
	totalAmount: number;
	currency: "PEN" | "USD";
	confidenceScore: number;
}

/**
 * generateDocumentId operation.
 *
 * @returns Result of generateDocumentId.
 * @example
 * ```ts
 * const result = generateDocumentId();
 * console.log(result);
 * ```
 */
export function generateDocumentId(): string {
	return `doc-${crypto.randomUUID()}`;
}

/**
 * detectFileType operation.
 *
 * @param filename - Input for filename.
 * @returns Result of detectFileType.
 * @example
 * ```ts
 * const result = detectFileType("");
 * console.log(result);
 * ```
 */
export function detectFileType(filename: string): "IMAGE" | "XML" | "PDF" {
	const ext = filename.toLowerCase().split(".").pop() || "";
	if (ext === "xml") return "XML";
	if (ext === "pdf") return "PDF";
	return "IMAGE";
}

/**
 * isValidFileType operation.
 *
 * @param filename - Input for filename.
 * @returns Result of isValidFileType.
 * @example
 * ```ts
 * const result = isValidFileType("");
 * console.log(result);
 * ```
 */
export function isValidFileType(filename: string): boolean {
	const ext = filename.toLowerCase().split(".").pop() || "";
	return ["pdf", "xml", "jpg", "jpeg", "png"].includes(ext);
}

function getFileExtension(filename: string): string | null {
	const ext = filename.toLowerCase().split(".").pop() || "";
	return ["pdf", "xml", "jpg", "jpeg", "png"].includes(ext) ? ext : null;
}

function detectMimeByMagicNumber(bytes: Buffer): string | null {
	if (
		bytes.length >= 5 &&
		bytes[0] === 0x25 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x44 &&
		bytes[3] === 0x46 &&
		bytes[4] === 0x2d
	) {
		return "application/pdf";
	}

	if (
		bytes.length >= 3 &&
		bytes[0] === 0xff &&
		bytes[1] === 0xd8 &&
		bytes[2] === 0xff
	) {
		return "image/jpeg";
	}

	if (
		bytes.length >= 8 &&
		bytes[0] === 0x89 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x4e &&
		bytes[3] === 0x47 &&
		bytes[4] === 0x0d &&
		bytes[5] === 0x0a &&
		bytes[6] === 0x1a &&
		bytes[7] === 0x0a
	) {
		return "image/png";
	}

	return null;
}

async function detectMimeType(bytes: Buffer): Promise<string | null> {
	try {
		const module = await import("file-type");
		const detected = await module.fileTypeFromBuffer(bytes);
		return detected?.mime ?? null;
	} catch {
		return detectMimeByMagicNumber(bytes);
	}
}

/**
 * validateFileContent operation.
 *
 * @param file - Input for file.
 * @returns Result of validateFileContent.
 * @example
 * ```ts
 * const result = await validateFileContent({} as File);
 * console.log(result);
 * ```
 */
export async function validateFileContent(file: File): Promise<boolean> {
	try {
		const buffer = await file.arrayBuffer();
		const bytes = Buffer.from(buffer);
		if (bytes.length === 0) return false;

		const extension = getFileExtension(file.name);
		if (!extension) return false;

		const detectedMime = await detectMimeType(bytes);

		if (extension === "xml") {
			if (
				detectedMime &&
				!["application/xml", "text/xml"].includes(detectedMime)
			) {
				return false;
			}

			const preview = bytes
				.subarray(0, Math.min(bytes.length, 2048))
				.toString("utf8")
				.replace(/^\uFEFF/, "")
				.trimStart();

			if (!preview.startsWith("<")) return false;
			if (preview.includes("\u0000")) return false;
			return true;
		}

		if (!detectedMime) return false;

		const expectedByExtension: Record<string, string[]> = {
			pdf: ["application/pdf"],
			jpg: ["image/jpeg"],
			jpeg: ["image/jpeg"],
			png: ["image/png"],
		};

		const allowed = expectedByExtension[extension] || [];
		return allowed.includes(detectedMime);
	} catch {
		return false;
	}
}

/**
 * parseXMLInvoice operation.
 *
 * @param content - Input for content.
 * @returns Result of parseXMLInvoice.
 * @throws Error when parseXMLInvoice cannot complete successfully.
 * @example
 * ```ts
 * const result = await parseXMLInvoice("");
 * console.log(result);
 * ```
 */
export async function parseXMLInvoice(
	content: string,
): Promise<ParsedXmlInvoiceData> {
	const normalizedContent = content.replace(/^\uFEFF/, "").trim();
	if (!normalizedContent) {
		throw new Error("XML content is empty");
	}

	if (Buffer.byteLength(normalizedContent, "utf8") > MAX_XML_PARSE_BYTES) {
		throw new Error("XML payload exceeds 2MB parse limit");
	}

	if (hasUnsafeXmlDeclarations(normalizedContent)) {
		throw new Error("XML DOCTYPE/ENTITY declarations are not allowed");
	}

	const parser = new UBLParser();
	const parsedResult = parser.safeParse(normalizedContent);

	if (!parsedResult.success || !parsedResult.data) {
		throw new Error(parsedResult.error || "Invalid UBL XML payload");
	}

	const parsed = parsedResult.data;
	return {
		providerRUC: parsed.supplierRuc,
		providerName: parsed.supplierName,
		issueDate: parsed.issueDate,
		documentNumber: parsed.id,
		baseAmount: parsed.subtotal,
		igvAmount: parsed.igv,
		totalAmount: parsed.totalAmount,
		currency: parsed.currency === "USD" ? "USD" : "PEN",
		confidenceScore: 1.0,
	};
}

/**
 * uploadToStorage operation.
 *
 * @param file - Input for file.
 * @param tenantScope - Input for tenantScope.
 * @returns Result of uploadToStorage.
 * @example
 * ```ts
 * const result = await uploadToStorage({} as File, {});
 * console.log(result);
 * ```
 */
export async function uploadToStorage(
	file: File,
	tenantScope: {
		organizationId?: number;
		companyId?: string;
	},
): Promise<string> {
	const { storageService } = await import("../../services/storage.service");
	const result = await storageService.upload(file, {
		...(tenantScope.organizationId !== undefined
			? { organizationId: tenantScope.organizationId }
			: {}),
		...(tenantScope.companyId !== undefined
			? { companyId: tenantScope.companyId }
			: {}),
		folder: "documents",
		contentType: file.type,
		isPublic: false,
	});

	return result.url;
}
