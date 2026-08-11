import { getControlPlaneJobMetadata } from "../features/ai-swarm/context-control-plane/control-plane-job-metadata";
import {
	type CountryCode,
	DEFAULT_COUNTRY_CODE,
	isCountryCode,
} from "./latam-country-packs";

export type AccountingJobCategory =
	| "reconciliation"
	| "compliance"
	| "closing"
	| "collections"
	| "payables";

export type AccountingJobCadence = "daily" | "weekly" | "monthly" | "on-demand";

export interface AccountingJobDefinition {
	id: string;
	surfaceId?: string;
	title: string;
	description: string;
	prompt: string;
	category: AccountingJobCategory;
	cadence: AccountingJobCadence;
	approvalRequired: boolean;
}

const BASE_JOBS: ReadonlyArray<AccountingJobDefinition> = [
	{
		id: "bank-reconciliation",
		title: "Conciliar bancos",
		description:
			"Cruza movimientos bancarios con comprobantes y propone ajustes.",
		prompt:
			"Conciliar bancos del periodo actual y mostrar diferencias pendientes",
		category: "reconciliation",
		cadence: "daily",
		approvalRequired: true,
	},
	{
		id: "accounts-receivable-review",
		title: "Revisar cobros",
		description:
			"Detecta facturas pendientes, vencidas y clientes con riesgo de mora.",
		prompt: "Revisar cuentas por cobrar y priorizar cobros del periodo actual",
		category: "collections",
		cadence: "weekly",
		approvalRequired: false,
	},
	{
		id: "accounts-payable-review",
		title: "Revisar pagos",
		description: "Prioriza obligaciones próximas a vencer y pagos críticos.",
		prompt:
			"Revisar cuentas por pagar y proponer prioridad de pagos del periodo actual",
		category: "payables",
		cadence: "weekly",
		approvalRequired: false,
	},
];

export const ACCOUNTING_JOB_CATALOG: Record<
	CountryCode,
	ReadonlyArray<AccountingJobDefinition>
> = {
	pe: [
		...BASE_JOBS,
		{
			id: "prepare-sire",
			title: "Preparar SIRE",
			description:
				"Genera y revisa los libros electrónicos del periodo antes de enviarlos.",
			prompt:
				"Preparar SIRE del periodo actual, validar registros y mostrar alertas",
			category: "compliance",
			cadence: "monthly",
			approvalRequired: true,
		},
		{
			id: "validate-cpe",
			title: "Validar CPE",
			description:
				"Revisa comprobantes con reglas SUNAT y detecta observados o rechazados.",
			prompt:
				"Validar comprobantes electrónicos pendientes con reglas SUNAT 2026",
			category: "compliance",
			cadence: "daily",
			approvalRequired: false,
		},
		{
			id: "monthly-igv-close",
			title: "Revisar IGV",
			description:
				"Compara IGV, detracciones y diferencias antes del cierre mensual.",
			prompt: "Revisar diferencias de IGV y detracciones del periodo actual",
			category: "closing",
			cadence: "monthly",
			approvalRequired: true,
		},
	],
	mx: [
		...BASE_JOBS,
		{
			id: "cfdi-timbrado-review",
			title: "Timbrar CFDI",
			description:
				"Prepara comprobantes CFDI 4.0 y revisa pendientes de timbrado.",
			prompt:
				"Preparar timbrado CFDI 4.0 del periodo actual y listar pendientes",
			category: "compliance",
			cadence: "daily",
			approvalRequired: true,
		},
		{
			id: "sat-catalog-validation",
			title: "Validar SAT",
			description: "Verifica claves SAT, uso CFDI y consistencia de catálogos.",
			prompt: "Validar claves SAT y uso CFDI del periodo actual",
			category: "compliance",
			cadence: "weekly",
			approvalRequired: false,
		},
		{
			id: "monthly-iva-review",
			title: "Revisar IVA",
			description: "Contrasta IVA trasladado y acreditable antes del corte.",
			prompt: "Revisar IVA trasladado y acreditable del periodo actual",
			category: "closing",
			cadence: "monthly",
			approvalRequired: true,
		},
	],
	cl: [
		...BASE_JOBS,
		{
			id: "dte-issuance-review",
			title: "Emitir DTE",
			description: "Prepara emisión DTE y revisa pendientes del periodo.",
			prompt: "Preparar emision DTE del periodo actual y listar pendientes",
			category: "compliance",
			cadence: "daily",
			approvalRequired: true,
		},
		{
			id: "sii-folio-review",
			title: "Revisar folios",
			description: "Controla folios disponibles y alertas del SII.",
			prompt: "Revisar folios disponibles y pendientes SII",
			category: "compliance",
			cadence: "weekly",
			approvalRequired: false,
		},
		{
			id: "monthly-iva-balance",
			title: "Cuadrar IVA",
			description: "Cuadra IVA compras y ventas antes del cierre.",
			prompt: "Cuadrar IVA de compras y ventas del periodo actual",
			category: "closing",
			cadence: "monthly",
			approvalRequired: true,
		},
	],
	co: [
		...BASE_JOBS,
		{
			id: "dian-validation",
			title: "Validar DIAN",
			description:
				"Revisa facturación electrónica y estados pendientes ante DIAN.",
			prompt: "Validar facturacion electronica DIAN del periodo actual",
			category: "compliance",
			cadence: "daily",
			approvalRequired: true,
		},
		{
			id: "support-document-review",
			title: "Documento soporte",
			description: "Detecta documentos soporte pendientes o inconsistentes.",
			prompt: "Revisar documentos soporte pendientes del periodo actual",
			category: "compliance",
			cadence: "weekly",
			approvalRequired: false,
		},
		{
			id: "monthly-iva-check",
			title: "Revisar IVA",
			description:
				"Contrasta IVA generado y descontable para el corte mensual.",
			prompt: "Revisar IVA generado y descontable del periodo actual",
			category: "closing",
			cadence: "monthly",
			approvalRequired: true,
		},
	],
};

export function getAccountingJobs(
	countryCode?: string | null,
): ReadonlyArray<AccountingJobDefinition> {
	const code =
		countryCode && isCountryCode(countryCode)
			? countryCode
			: DEFAULT_COUNTRY_CODE;
	return ACCOUNTING_JOB_CATALOG[code].map((job) => {
		const metadata = getControlPlaneJobMetadata(job.id);

		return {
			...job,
			...(metadata?.surfaceId !== undefined
				? { surfaceId: metadata.surfaceId }
				: {}),
			approvalRequired: metadata
				? metadata.approvalsRequired.length > 0
				: job.approvalRequired,
		};
	});
}
