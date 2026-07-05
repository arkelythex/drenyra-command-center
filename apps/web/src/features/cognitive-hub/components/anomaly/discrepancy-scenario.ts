import type { HubArtifact, SheetDiffRow } from "@drenyra/shared/artifacts";

export interface DiscrepancyLegalReference {
	id: string;
	label: string;
	excerpt: string;
	sourceUrl: string;
	effectiveDate: string;
}

export interface DiscrepancyScenario {
	id: string;
	title: string;
	command: string;
	sourceName: string;
	xmlLines: string[];
	erpLines: string[];
	explanation: string;
	recommendation: string;
	rows: SheetDiffRow[];
	originalData: Array<Record<string, unknown>>;
	correctedData: Array<Record<string, unknown>>;
	legalReferences: DiscrepancyLegalReference[];
}

export function buildDefaultDiscrepancyScenario(): DiscrepancyScenario {
	const rows: SheetDiffRow[] = [
		{
			id: "diff-1",
			record: "F001-4482 · RUC 20608451230",
			original: "S/ 5,112.00",
			corrected: "S/ 5,083.20",
			status: "flagged",
			reason: "Total ERP no coincide con XML declarado en SUNAT.",
		},
		{
			id: "diff-2",
			record: "F001-4483 · RUC 20608451230",
			original: "S/ 1,920.00",
			corrected: "S/ 1,920.00",
			status: "unchanged",
			reason: "Registro consistente, sin ajuste.",
		},
		{
			id: "diff-3",
			record: "F001-4484 · RUC 20608451230",
			original: "S/ 2,360.42",
			corrected: "S/ 2,360.40",
			status: "updated",
			reason: "Ajuste de redondeo para cuadrar base + IGV.",
		},
	];

	return {
		id: "sire-igv-2026-02",
		title: "Revisión de Discrepancia IGV",
		command: "Aplicar ajuste de redondeo cuenta 4011",
		sourceName: "Conciliación SUNAT XML vs ERP",
		xmlLines: [
			"<Invoice>",
			"  <cbc:ID>F001-4482</cbc:ID>",
			"  <cbc:IssueDate>2026-02-14</cbc:IssueDate>",
			"  <cac:AccountingSupplierParty>",
			"    <cbc:CustomerAssignedAccountID>20608451230</cbc:CustomerAssignedAccountID>",
			"  </cac:AccountingSupplierParty>",
			"  <cac:TaxTotal>",
			'    <cbc:TaxAmount currencyID="PEN">915.00</cbc:TaxAmount>',
			"  </cac:TaxTotal>",
			"  <cac:LegalMonetaryTotal>",
			'    <cbc:PayableAmount currencyID="PEN">5083.20</cbc:PayableAmount>',
			"  </cac:LegalMonetaryTotal>",
			"</Invoice>",
		],
		erpLines: [
			"doc_id: F001-4482",
			"supplier_ruc: 20608451230",
			"issue_date: 2026-02-14",
			"base_amount: 4197.00",
			"igv_amount: 915.00",
			"total_amount: 5112.00",
			"status: posted",
		],
		explanation:
			"El ERP local registra S/ 5,112.00, pero el XML declarado a SUNAT confirma S/ 5,083.20.",
		recommendation:
			"Aplicar ajuste de redondeo y actualizar el asiento antes del cierre.",
		rows,
		originalData: [
			{
				documento: "F001-4482",
				ruc: "20608451230",
				fecha: "2026-02-14",
				base: 4197,
				igv: 915,
				monto: 5112,
				estado: "POSTED",
			},
			{
				documento: "F001-4483",
				ruc: "20608451230",
				fecha: "2026-02-14",
				base: 1627.12,
				igv: 292.88,
				monto: 1920,
				estado: "POSTED",
			},
			{
				documento: "F001-4484",
				ruc: "20608451230",
				fecha: "2026-02-14",
				base: 2000.36,
				igv: 360.06,
				monto: 2360.42,
				estado: "POSTED",
			},
		],
		correctedData: [
			{
				documento: "F001-4482",
				ruc: "20608451230",
				fecha: "2026-02-14",
				base: 4188.2,
				igv: 895,
				monto: 5083.2,
				estado: "POSTED",
			},
			{
				documento: "F001-4483",
				ruc: "20608451230",
				fecha: "2026-02-14",
				base: 1627.12,
				igv: 292.88,
				monto: 1920,
				estado: "POSTED",
			},
			{
				documento: "F001-4484",
				ruc: "20608451230",
				fecha: "2026-02-14",
				base: 2000.34,
				igv: 360.06,
				monto: 2360.4,
				estado: "POSTED",
			},
		],
		legalReferences: [
			{
				id: "ley-igv-19-b",
				label: "Art. 19 Ley del IGV - Inciso b",
				excerpt:
					"Otorga derecho al crédito fiscal cuando el comprobante cumpla requisitos formales y sustanciales.",
				sourceUrl: "https://www.sunat.gob.pe/legislacion/igv/index.html",
				effectiveDate: "2026-01-01",
			},
			{
				id: "rsi-112",
				label: "RS 112-2021/SUNAT (SIRE)",
				excerpt:
					"La información de registros electrónicos debe ser consistente con los comprobantes emitidos y recibidos.",
				sourceUrl:
					"https://www.sunat.gob.pe/legislacion/superin/2021/112-2021.pdf",
				effectiveDate: "2022-01-01",
			},
		],
	};
}

export function buildDiscrepancyArtifactFromScenario(
	scenario: DiscrepancyScenario,
): HubArtifact {
	const updated = scenario.rows.filter(
		(row) => row.status === "updated",
	).length;
	const flagged = scenario.rows.filter(
		(row) => row.status === "flagged",
	).length;

	return {
		id: crypto.randomUUID(),
		type: "sheet_diff",
		title: scenario.title,
		payload: {
			command: scenario.command,
			sourceName: scenario.sourceName,
			acceptShortcut: "Ctrl+Enter",
			summary: {
				total: scenario.rows.length,
				updated,
				flagged,
			},
			rows: scenario.rows,
		},
	};
}
