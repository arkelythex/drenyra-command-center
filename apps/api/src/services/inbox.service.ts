import { extractIgvFromUbl, RUC } from "@arkelythex/domain";
import { db } from "@arkelythex/persistence/client";
import { eq } from "@arkelythex/persistence/query";
import { businessPartners, transactions } from "@arkelythex/persistence/schema";
import { XMLParser } from "fast-xml-parser";
import { createLogger } from "../lib/logger";

const logger = createLogger({ module: "services/inbox" });

type InboxTransaction = typeof transactions.$inferSelect;

function maskRuc(ruc: string): string {
	if (ruc.length <= 4) return "***";
	return `${"*".repeat(Math.max(0, ruc.length - 4))}${ruc.slice(-4)}`;
}

// biome-ignore lint/complexity/noStaticOnlyClass: Domain service — static methods are intentional
export class InboxService {
	/**
	 * Procesa un archivo subido (XML UBL 2.1 o PDF)
	 * Lógica robusta usando fast-xml-parser
	 */
	static async processUpload(
		file: File,
		companyId: string,
	): Promise<InboxTransaction> {
		const fileType = file.type;
		const text = await file.text();
		const fileName = file.name;

		logger.info(
			{
				companyId,
				fileName,
				fileType: fileType || "unknown",
			},
			"Received inbox upload",
		);

		// Detectar si es XML (por contenido o extensión)
		if (fileName.toLowerCase().endsWith(".xml") || text.includes("<?xml")) {
			return InboxService.processXML(text, companyId, fileName);
		} else {
			// PDF u otros: Guardar como pendiente de revisión manual
			logger.info(
				{
					companyId,
					fileName,
				},
				"PDF or unsupported structured document detected; creating manual review record",
			);
			return InboxService.createPendingTransaction(
				companyId,
				fileName,
				"PDF_UPLOAD",
			);
		}
	}

	private static async processXML(
		xmlContent: string,
		companyId: string,
		fileName: string,
	): Promise<InboxTransaction> {
		try {
			// 1. Configuración Profesional del Parser - Respeta Namespaces UBL 2.1
			const parser = new XMLParser({
				ignoreAttributes: false, // Necesitamos atributos para currencyID y schemeID
				attributeNamePrefix: "@_",
				parseTagValue: true,
				trimValues: true,
				parseAttributeValue: true,
			});

			const doc = parser.parse(xmlContent);

			// 2. Normalizar la raíz con namespaces (Factura, Boleta, NotaCredito)
			const invoice =
				doc.Invoice || doc.Bill || doc.CreditNote || doc.DebitNote;

			if (!invoice) {
				throw new Error(
					"Estructura XML no reconocida: No es un CPE válido (Invoice/Bill) según estándar UBL 2.1",
				);
			}

			// 3. Extracción de Datos respetando estructura UBL 2.1 con namespaces

			// -- Proveedor --
			const supplierParty =
				invoice["cac:AccountingSupplierParty"]?.["cac:Party"];
			const ruc =
				supplierParty?.["cac:PartyIdentification"]?.["cbc:ID"] || "00000000000";

			// Validar que el RUC exista y sea válido
			if (!ruc || ruc === "00000000000") {
				throw new Error("RUC del emisor no encontrado en el XML");
			}
			if (!RUC.isValid(ruc)) {
				throw new Error(
					`RUC del emisor inválido: ${ruc} (no cumple algoritmo Módulo 11)`,
				);
			}

			const businessName =
				supplierParty?.["cac:PartyLegalEntity"]?.["cbc:RegistrationName"] ||
				supplierParty?.["cac:PartyName"]?.["cbc:Name"] ||
				"Proveedor Desconocido";

			// -- Identificador del Documento --
			const fullId = invoice["cbc:ID"]; // Ej: F001-00001234
			if (!fullId) {
				throw new Error("ID del documento no encontrado en el XML");
			}
			const [series, number] = fullId.split("-");
			if (!series || !number) {
				throw new Error(
					`Formato de ID inválido: ${fullId} (debe ser SERIE-NUMERO)`,
				);
			}

			// -- Fechas --
			const issueDateStr = invoice["cbc:IssueDate"];
			if (!issueDateStr) {
				throw new Error("Fecha de emisión no encontrada en el XML");
			}
			const issueDate = new Date(issueDateStr);
			if (isNaN(issueDate.getTime())) {
				throw new Error(`Fecha de emisión inválida: ${issueDateStr}`);
			}

			// -- Importes y Moneda --
			const legalMonetaryTotal = invoice.LegalMonetaryTotal;
			const totalAmountStr =
				legalMonetaryTotal?.PayableAmount?.["#text"] ||
				legalMonetaryTotal?.PayableAmount ||
				0;
			const totalAmount = parseFloat(totalAmountStr);

			const currency =
				legalMonetaryTotal?.PayableAmount?.["@_currencyID"] || "PEN";

			// -- Extracción de Impuestos (IGV) --
			const igvAmount = extractIgvFromUbl(invoice.TaxTotal, totalAmount);

			logger.info(
				{
					businessName,
					companyId,
					currency,
					fileName,
					igvAmount,
					rucMasked: maskRuc(ruc),
					totalAmount,
				},
				"Validated inbox XML document",
			);

			// 4. Lógica de Negocio: Gestión de Proveedores
			// Buscamos si el proveedor ya existe en nuestra DB
			let partner = await db.query.businessPartners.findFirst({
				where: eq(businessPartners.taxId, ruc),
			});

			if (!partner) {
				// Si es nuevo, lo registramos automáticamente (Onboarding pasivo)
				logger.info(
					{
						businessName,
						companyId,
						rucMasked: maskRuc(ruc),
					},
					"Registering new supplier from inbox XML",
				);
				try {
					[partner] = await db
						.insert(businessPartners)
						.values({
							companyId,
							taxId: ruc,
							legalName: businessName,
							complianceScore: 100, // Score inicial neutral
							sunatCondition: "HABIDO",
						})
						.returning();
				} catch (e) {
					// Manejo de concurrencia: si otro proceso lo creó en milisegundos
					partner = await db.query.businessPartners.findFirst({
						where: eq(businessPartners.taxId, ruc),
					});
				}
			}

			if (!partner) throw new Error("Error crítico al asignar proveedor");

			// 5. Persistencia: Guardar Transacción
			const [transaction] = await db
				.insert(transactions)
				.values({
					companyId,
					partnerId: partner.id,
					type: "EXPENSE", // Asumimos gasto por defecto al subir a inbox
					documentType: "FACTURA",
					series: series,
					number: number,
					issueDate: issueDate,
					currency: currency === "USD" ? "USD" : "PEN",
					totalAmount: totalAmount.toString(),
					igvAmount: igvAmount.toFixed(2), // GUARDAMOS EL IGV PARA EL DASHBOARD
					subtotal: (totalAmount - igvAmount).toFixed(2), // También el subtotal
					status: "DRAFT", // Estado correcto: Borrador en Inbox
					xmlUrl: fileName,
					notes: `CPE Importado: ${businessName}`,
				})
				.returning();

			return transaction;
		} catch (error) {
			logger.error(
				{
					error,
					companyId,
					fileName,
				},
				"Inbox XML processing failed",
			);

			// Proporcionar errores descriptivos según el tipo de falla
			let errorMessage = "Error desconocido en el procesamiento del XML";

			if (error instanceof Error) {
				if (error.message.includes("RUC")) {
					errorMessage = `Error de validación RUC: ${error.message}`;
				} else if (error.message.includes("Fecha")) {
					errorMessage = `Error en fecha del documento: ${error.message}`;
				} else if (
					error.message.includes("Monto") ||
					error.message.includes("moneda")
				) {
					errorMessage = `Error en información monetaria: ${error.message}`;
				} else if (error.message.includes("Estructura XML")) {
					errorMessage = `XML no cumple con estándar UBL 2.1: ${error.message}`;
				} else {
					errorMessage = `XML inválido: ${error.message}`;
				}
			}

			throw new Error(errorMessage);
		}
	}

	private static async createPendingTransaction(
		companyId: string,
		fileName: string,
		type: string,
	): Promise<InboxTransaction> {
		const [transaction] = await db
			.insert(transactions)
			.values({
				companyId,
				type: "EXPENSE",
				documentType: "FACTURA",
				series: "DOC",
				number: "PEND-" + Date.now().toString().slice(-6),
				issueDate: new Date(),
				totalAmount: "0.00",
				status: "DRAFT",
				xmlUrl: fileName,
				notes: `Documento ${type} pendiente de digitación`,
			})
			.returning();

		logger.info(
			{
				companyId,
				fileName,
				transactionId: transaction?.id,
				uploadType: type,
			},
			"Created pending inbox transaction",
		);

		return transaction;
	}
}
