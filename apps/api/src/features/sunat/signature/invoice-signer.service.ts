/**
 * Invoice Signer Service
 * High-level service for generating and signing invoices
 *
 * Orchestrates:
 * 1. XML UBL 2.1 generation
 * 2. Digital signature
 * 3. ZIP packaging (for SUNAT submission)
 */

import fs from "node:fs";
import path from "node:path";
import { promisify } from "util";
// @ts-expect-error — archiver v8 has no type declarations but `ZipArchive` is a valid named export at runtime
import { ZipArchive } from "archiver";
import { createLogger } from "../../../lib/logger";
import type { CreditNoteData, InvoiceData } from "../types/ubl.types";
import { generateInvoiceXml } from "../xml/invoice-ubl.generator";
import { generateCreditNoteXml } from "../xml/credit-note-ubl.generator";
import { signXml } from "./xml-signer";
import type { Certificate } from "./certificate.handler";

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const logger = createLogger({
	module: "sunat/signature/invoice-signer-service",
});

/**
 * Signed invoice result
 *
 * @example
 * ```ts
 * const res: SignedInvoiceResult = {
 *   xml: "<SignedXml/>",
 *   fileName: "20123456789-01-F001-00000001.xml",
 *   zipFileName: "20123456789-01-F001-00000001.zip",
 *   hash: "sha256...",
 * };
 * ```
 */
export interface SignedInvoiceResult {
	xml: string; // Signed XML
	fileName: string; // RUC-TipoDoc-Serie-Numero.xml
	zipFileName: string; // RUC-TipoDoc-Serie-Numero.zip
	hash: string; // SHA-256 hash
}

/**
 * Generate and sign invoice
 *
 * @param invoiceData - Invoice data for UBL generation
 * @param certificate - Signing certificate (private key + public cert)
 * @param outputDir - Optional output directory to write XML/ZIP
 * @returns Signed invoice artifacts
 *
 * @example
 * ```ts
 * const res = await generateAndSignInvoice({ id: "F001-00000001" } as InvoiceData, cert);
 * ```
 */
export async function generateAndSignInvoice(
	invoiceData: InvoiceData,
	certificate: Certificate,
	outputDir?: string,
): Promise<SignedInvoiceResult> {
	// 1. Generate XML
	const { xml: unsignedXml, fileName, hash } = generateInvoiceXml(invoiceData);

	// 2. Sign XML
	const signedXml = signXml(unsignedXml, certificate);

	// 3. Save to file (if outputDir provided)
	if (outputDir) {
		await saveSignedXml(signedXml, fileName, outputDir);
	}

	// 4. Create ZIP file (SUNAT requires ZIP)
	const zipFileName = fileName.replace(".xml", ".zip");
	if (outputDir) {
		await createZipFile(signedXml, fileName, path.join(outputDir, zipFileName));
	}

	return {
		xml: signedXml,
		fileName,
		zipFileName,
		hash,
	};
}

/**
 * Generate and sign credit note
 *
 * @param creditNoteData - Credit note data for UBL generation
 * @param certificate - Signing certificate (private key + public cert)
 * @param outputDir - Optional output directory to write XML/ZIP
 * @returns Signed credit note artifacts
 *
 * @example
 * ```ts
 * const res = await generateAndSignCreditNote({ id: "FC01-00000001" } as CreditNoteData, cert);
 * ```
 */
export async function generateAndSignCreditNote(
	creditNoteData: CreditNoteData,
	certificate: Certificate,
	outputDir?: string,
): Promise<SignedInvoiceResult> {
	// 1. Generate XML
	const {
		xml: unsignedXml,
		fileName,
		hash,
	} = generateCreditNoteXml(creditNoteData);

	// 2. Sign XML
	const signedXml = signXml(unsignedXml, certificate);

	// 3. Save to file
	if (outputDir) {
		await saveSignedXml(signedXml, fileName, outputDir);
	}

	// 4. Create ZIP
	const zipFileName = fileName.replace(".xml", ".zip");
	if (outputDir) {
		await createZipFile(signedXml, fileName, path.join(outputDir, zipFileName));
	}

	return {
		xml: signedXml,
		fileName,
		zipFileName,
		hash,
	};
}

/**
 * Save signed XML to file
 */
async function saveSignedXml(
	signedXml: string,
	fileName: string,
	outputDir: string,
): Promise<void> {
	// Ensure output directory exists
	await mkdir(outputDir, { recursive: true });

	const filePath = path.join(outputDir, fileName);
	await writeFile(filePath, signedXml, "utf8");

	logger.info({ filePath }, "Signed XML saved");
}

/**
 * Create ZIP file for SUNAT submission
 * SUNAT requires XML files to be zipped before sending to OSE
 */
async function createZipFile(
	xmlContent: string,
	xmlFileName: string,
	zipFilePath: string,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const output = fs.createWriteStream(zipFilePath);
		const archive = new ZipArchive({
			zlib: { level: 9 }, // Maximum compression
		});

		output.on("close", () => {
			logger.info(
				{
					bytes: archive.pointer(),
					zipFilePath,
				},
				"ZIP created for SUNAT submission",
			);
			resolve();
		});

		archive.on("error", (err: Error) => {
			reject(err);
		});

		archive.pipe(output);

		// Add XML to ZIP
		archive.append(xmlContent, { name: xmlFileName });

		archive.finalize();
	});
}

/**
 * Batch sign multiple invoices
 *
 * @param invoices - Invoice list to generate and sign
 * @param certificate - Signing certificate
 * @param outputDir - Output directory for files
 * @returns Signed invoice results
 * @throws {unknown} Re-throws the first error encountered during signing
 *
 * @example
 * ```ts
 * const results = await batchSignInvoices([{ id: "F001-00000001" } as InvoiceData], cert, "/tmp/out");
 * ```
 */
export async function batchSignInvoices(
	invoices: InvoiceData[],
	certificate: Certificate,
	outputDir: string,
): Promise<SignedInvoiceResult[]> {
	const results: SignedInvoiceResult[] = [];

	for (const invoice of invoices) {
		try {
			const result = await generateAndSignInvoice(
				invoice,
				certificate,
				outputDir,
			);
			results.push(result);
		} catch (error) {
			logger.error({ error, invoiceId: invoice.id }, "Failed to sign invoice");
			throw error;
		}
	}

	logger.info({ signedCount: results.length }, "Batch signed invoices");
	return results;
}
