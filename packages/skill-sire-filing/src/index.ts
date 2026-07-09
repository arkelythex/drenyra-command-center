/**
 * @drenyra/skill-sire-filing — SIRE Filing Skill
 *
 * Monitors CPE submission deadlines to SUNAT and detects anomalies.
 * Legal reference: Resolución de Superintendencia N° 000155-2021/SUNAT
 *
 * @module @drenyra/skill-sire-filing
 */

import type { DrenyraSkill, SkillContext } from "@drenyra/pi";

export interface SireFilingRecord {
	/** RUC del emisor */
	emisorRuc: string;
	/** Tipo de documento (01=factura, 03=boleta, etc) */
	tipoDoc: string;
	/** Serie del documento */
	serie: string;
	/** Número correlativo */
	numero: string;
	/** Fecha de emisión (ISO) */
	fechaEmision: string;
	/** Fecha de envío a SUNAT (ISO, null si no enviado) */
	fechaEnvio?: string;
	/** CDR (Constancia de Recepción) recibida */
	cdrRecibido: boolean;
	/** Código de la SUNAT response */
	cdrCodigo?: string;
	/** Monto total del comprobante */
	montoTotal: number;
}

export interface SireFilingAnomaly {
	tipo: "overdue" | "critical-overdue" | "missing-cdr" | "near-deadline";
	documento: string;
	emisorRuc: string;
	diasVencidos: number;
	descripcion: string;
	severidad: "baja" | "media" | "alta" | "critica";
}

const SIRE_DEADLINE_DAYS = 7;
const CRITICAL_OVERDUE_DAYS = 30;

/**
 * Detecta documentos con fechas de envío vencidas o próximas a vencer.
 */
export function detectOverdueDocuments(
	records: SireFilingRecord[],
	now: Date = new Date(),
): SireFilingAnomaly[] {
	const anomalies: SireFilingAnomaly[] = [];

	for (const doc of records) {
		const emision = new Date(doc.fechaEmision);
		const deadline = new Date(emision);
		deadline.setDate(deadline.getDate() + SIRE_DEADLINE_DAYS);

		const diasVencidos = Math.floor(
			(now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24),
		);

		if (diasVencidos > CRITICAL_OVERDUE_DAYS) {
			anomalies.push({
				tipo: "critical-overdue",
				documento: `${doc.tipoDoc}-${doc.serie}-${doc.numero}`,
				emisorRuc: doc.emisorRuc,
				diasVencidos,
				descripcion: `Documento vencido por ${diasVencidos} días sin enviar a SUNAT`,
				severidad: "critica",
			});
		} else if (diasVencidos > 0 && doc.fechaEnvio === undefined) {
			anomalies.push({
				tipo: "overdue",
				documento: `${doc.tipoDoc}-${doc.serie}-${doc.numero}`,
				emisorRuc: doc.emisorRuc,
				diasVencidos,
				descripcion: `Documento vencido por ${diasVencidos} días`,
				severidad: "alta",
			});
		} else if (diasVencidos >= -2 && diasVencidos <= 0) {
			anomalies.push({
				tipo: "near-deadline",
				documento: `${doc.tipoDoc}-${doc.serie}-${doc.numero}`,
				emisorRuc: doc.emisorRuc,
				diasVencidos,
				descripcion: `Documento próximo al deadline (${Math.abs(diasVencidos)} días restantes)`,
				severidad: "media",
			});
		}

		if (doc.fechaEnvio && !doc.cdrRecibido) {
			anomalies.push({
				tipo: "missing-cdr",
				documento: `${doc.tipoDoc}-${doc.serie}-${doc.numero}`,
				emisorRuc: doc.emisorRuc,
				diasVencidos: 0,
				descripcion: "Documento enviado pero sin CDR de recepción",
				severidad: "alta",
			});
		}
	}

	return anomalies;
}

/**
 * DrenyraSkill — SIRE Filing compliance monitoring.
 */
const skill: DrenyraSkill = {
	id: "sire-filing",
	name: "SIRE Filing",
	version: "0.1.0",
	description:
		"Electronic books (SIRE) filing compliance for SUNAT. " +
		"Monitors CPE submission deadlines, detects overdue documents, " +
		"and validates CDR receipts.",

	strategies: [
		{
			name: "sire-filing-anomaly-detection",
			async execute(input: unknown): Promise<SireFilingAnomaly[]> {
				const records = input as SireFilingRecord[];
				return detectOverdueDocuments(records);
			},
		},
	],

	async initialize(ctx: SkillContext): Promise<void> {
		ctx.logger.info("SIRE Filing skill initialized");

		// Register SIRE deadline constant in config
		if (!ctx.config.sireDeadlineDays) {
			ctx.config.sireDeadlineDays = SIRE_DEADLINE_DAYS;
		}
		if (!ctx.config.criticalOverdueDays) {
			ctx.config.criticalOverdueDays = CRITICAL_OVERDUE_DAYS;
		}
	},
};

export default skill;
export { skill };
