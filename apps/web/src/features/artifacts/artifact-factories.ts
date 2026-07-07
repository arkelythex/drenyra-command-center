import {
	ARTIFACT_TYPES,
	type ArtifactMetadata,
	type BankingReconciliationArtifact,
	type BillsPayableArtifact,
	type CashflowProjectionArtifact,
	type CurrencyCode,
	type PaymentBeneficiary,
	type PaymentPreviewArtifact,
	type PayrollSummaryArtifact,
	type SireDiffArtifact,
	type SireDiffRow,
	type TaxSummaryArtifact,
	type WorkspaceArtifact,
} from "./types/artifact.types";

const SIRE_TRIGGER_KEYWORDS = ["sire", "concili", "rvie", "rce"];
const BILLS_TRIGGER_KEYWORDS = [
	"cuenta",
	"pagar",
	"cxp",
	"factura",
	"proveedor",
	"bill",
	"vencimient",
	"pago",
];

const CASHFLOW_TRIGGER_KEYWORDS = [
	"flujo",
	"caja",
	"cashflow",
	"proyeccion",
	"liquidez",
	"efectivo",
];

const TAX_TRIGGER_KEYWORDS = [
	"tributo",
	"impuesto",
	"tax",
	"igv",
	"renta",
	"sunat",
	"declaraci",
	"calcular.*tributo",
];

const PAYROLL_TRIGGER_KEYWORDS = [
	"planilla",
	"nomina",
	"payroll",
	"salario",
	"empleado",
	"sueldo",
];

const BANKING_TRIGGER_KEYWORDS = [
	"conciliacion",
	"conciliar",
	"reconcili",
	"banco",
	"bancaria",
	"movimient",
	"saldo",
	"tesorer",
];

const PAYMENT_TRIGGER_KEYWORDS = [
	"pago",
	"tesorer",
	"banco",
	"transfer",
	"lote",
	"beneficiario",
];

const generateTraceId = (): string =>
	`tr_${Math.random().toString(36).slice(2, 11)}`;
const generateCorrelationId = (): string =>
	`corr_${Math.random().toString(36).slice(2, 11)}`;
const generateArtifactId = (): string =>
	`art_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

function createMetadata(
	source: ArtifactMetadata["source"],
	actor = "OmniAgent-Core",
): ArtifactMetadata {
	return {
		traceId: generateTraceId(),
		correlationId: generateCorrelationId(),
		source,
		createdAt: new Date().toISOString(),
		actor,
	};
}

function toMoney(value: number): number {
	return Number(value.toFixed(2));
}

function buildSireSummary(rows: SireDiffRow[]) {
	const matched = rows.filter((row) => row.status === "MATCH").length;
	const mismatched = rows.filter((row) => row.status === "MISMATCH").length;
	const missingOnLedger = rows.filter(
		(row) => row.status === "MISSING_LOCAL",
	).length;
	const missingOnSunat = rows.filter(
		(row) => row.status === "MISSING_SUNAT",
	).length;
	const critical = mismatched + missingOnLedger + missingOnSunat;
	const totalDifference = toMoney(
		rows.reduce((acc, row) => acc + row.difference, 0),
	);

	return {
		matched,
		mismatched,
		missingOnLedger,
		missingOnSunat,
		critical,
		totalDifference,
	};
}

function extractPeriodFromQuery(query: string): string | null {
	const match = query.match(/\b(20\d{2})[-/](0[1-9]|1[0-2])\b/);
	if (!match) return null;
	return `${match[1]}-${match[2]}`;
}

function extractCurrencyFromQuery(query: string): CurrencyCode {
	if (query.includes("usd") || query.includes("dolar") || query.includes("$")) {
		return "USD";
	}
	return "PEN";
}

export const createSireDiffArtifact = (
	period = "2026-01",
): SireDiffArtifact => {
	const rows: SireDiffRow[] = [
		{
			id: "rvie-001",
			status: "MATCH",
			reason: "Montos y fecha consistentes en ambos libros.",
			difference: 0,
			localRecord: {
				documentType: "01",
				series: "F001",
				number: "4599",
				issueDate: `${period}-05`,
				total: 1250.0,
				currency: "PEN",
				ruc: "20100045678",
				reasonSocial: "SERVICIOS CLOUD PERU S.A.C.",
			},
			sunatRecord: {
				documentType: "01",
				series: "F001",
				number: "4599",
				issueDate: `${period}-05`,
				total: 1250.0,
				currency: "PEN",
				ruc: "20100045678",
				reasonSocial: "SERVICIOS CLOUD PERU S.A.C.",
			},
			resolution: "KEPT_LOCAL",
		},
		{
			id: "rvie-002",
			status: "MISMATCH",
			reason: "Diferencia en IGV reportado.",
			difference: -50.0,
			localRecord: {
				documentType: "01",
				series: "E001",
				number: "230",
				issueDate: `${period}-08`,
				total: 4500.0,
				currency: "PEN",
				ruc: "20556677889",
				reasonSocial: "LOGISTICA INTEGRAL S.A.",
			},
			sunatRecord: {
				documentType: "01",
				series: "E001",
				number: "230",
				issueDate: `${period}-08`,
				total: 4550.0,
				currency: "PEN",
				ruc: "20556677889",
				reasonSocial: "LOGISTICA INTEGRAL S.A.",
			},
			resolution: "PENDING",
		},
		{
			id: "rvie-003",
			status: "MISSING_LOCAL",
			reason: "Comprobante detectado en SUNAT no registrado en ERP.",
			difference: -2300.0,
			sunatRecord: {
				documentType: "01",
				series: "F099",
				number: "112",
				issueDate: `${period}-12`,
				total: 2300.0,
				currency: "PEN",
				ruc: "20601234567",
				reasonSocial: "CONSULTORA FINANCIERA ELITE",
			},
			resolution: "PENDING",
		},
		{
			id: "rvie-004",
			status: "MISSING_SUNAT",
			reason: "Comprobante local pendiente de validación en SUNAT.",
			difference: 890.0,
			localRecord: {
				documentType: "01",
				series: "F002",
				number: "887",
				issueDate: `${period}-15`,
				total: 890.0,
				currency: "PEN",
				ruc: "20498877665",
				reasonSocial: "PROVEEDORES UNIDOS S.A.C.",
			},
			resolution: "PENDING",
		},
		{
			id: "rvie-005",
			status: "MATCH",
			reason: "Coincidencia total.",
			difference: 0,
			localRecord: {
				documentType: "01",
				series: "F020",
				number: "5566",
				issueDate: `${period}-20`,
				total: 340.5,
				currency: "PEN",
				ruc: "20100099988",
				reasonSocial: "TELECOMUNICACIONES GLOBALES",
			},
			sunatRecord: {
				documentType: "01",
				series: "F020",
				number: "5566",
				issueDate: `${period}-20`,
				total: 340.5,
				currency: "PEN",
				ruc: "20100099988",
				reasonSocial: "TELECOMUNICACIONES GLOBALES",
			},
			resolution: "KEPT_LOCAL",
		},
	];

	return {
		id: generateArtifactId(),
		type: ARTIFACT_TYPES.SIRE_DIFF,
		version: "1.1.0",
		status: "PREVIEW",
		title: `Conciliación RVIE ${period}`,
		description:
			"Diff entre libro local y propuesta SUNAT con trazabilidad por fila.",
		metadata: createMetadata("SUNAT"),
		data: {
			period,
			currency: "PEN",
			summary: buildSireSummary(rows),
			rows,
		},
		actions: [
			{
				id: "accept-sunat-batch",
				label: "Aceptar SUNAT (lote)",
				type: "PRIMARY",
				requiresConfirmation: true,
				riskLevel: "HIGH",
				policyGate: {
					policyKey: "SIRE_BATCH_COMMIT",
					requiresReason: true,
					requiresDualApproval: true,
				},
			},
			{
				id: "keep-local-batch",
				label: "Mantener Local (lote)",
				type: "SECONDARY",
			},
		],
	};
};

export const createPaymentPreviewArtifact = (
	currency: CurrencyCode = "PEN",
): PaymentPreviewArtifact => {
	const beneficiaries: PaymentBeneficiary[] = [
		{
			id: "ben-001",
			name: "Servicios Digitales Andes S.A.C.",
			bankAccount: "191-284756-0-12",
			amount: 4200.0,
		},
		{
			id: "ben-002",
			name: "Operaciones Logisticas Sur EIRL",
			bankAccount: "194-902002-0-44",
			amount: 2750.4,
		},
		{
			id: "ben-003",
			name: "Consultoria Financiera Lima S.A.",
			bankAccount: "191-638210-0-09",
			amount: 1980.3,
		},
	];

	const totalAmount = toMoney(
		beneficiaries.reduce((acc, beneficiary) => acc + beneficiary.amount, 0),
	);

	return {
		id: generateArtifactId(),
		type: ARTIFACT_TYPES.PAYMENT_PREVIEW,
		version: "1.0.0",
		status: "PREVIEW",
		title: "Vista previa de lote de pagos",
		description: "Simulación de ejecución bancaria antes de confirmar el lote.",
		metadata: createMetadata("BANK"),
		data: {
			provider: "BCP",
			bankAccount: currency === "USD" ? "USD-191-002184" : "PEN-191-002183",
			currency,
			totalAmount,
			beneficiaries,
		},
		actions: [
			{
				id: "confirm-payment",
				label: "Confirmar lote",
				type: "PRIMARY",
				requiresConfirmation: true,
				riskLevel: "CRITICAL",
				policyGate: {
					policyKey: "PAYMENT_BATCH_EXECUTION",
					requiresReason: true,
					requiresDualApproval: true,
				},
			},
			{ id: "cancel-payment", label: "Cancelar", type: "DANGER" },
			{ id: "download-voucher", label: "Descargar resumen", type: "SECONDARY" },
		],
	};
};

/**
 * Compat export for OmniAgent + legacy callers.
 */
export const resolveArtifactFromQuery = (
	query: string,
): WorkspaceArtifact | null => {
	const normalized = query.toLowerCase().trim();
	if (!normalized) return null;

	if (SIRE_TRIGGER_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
		const period = extractPeriodFromQuery(normalized) ?? "2026-01";
		return createSireDiffArtifact(period);
	}

	if (
		PAYMENT_TRIGGER_KEYWORDS.some((keyword) => normalized.includes(keyword))
	) {
		const currency = extractCurrencyFromQuery(normalized);
		return createPaymentPreviewArtifact(currency);
	}

	if (
		BANKING_TRIGGER_KEYWORDS.some((keyword) => normalized.includes(keyword))
	) {
		const period = extractPeriodFromQuery(normalized) ?? "2026-01";
		const currency = extractCurrencyFromQuery(normalized);
		return createBankingReconciliationArtifact({ period, currency });
	}

	if (BILLS_TRIGGER_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
		const currency = extractCurrencyFromQuery(normalized);
		return createBillsPayableArtifact(currency);
	}

	if (
		CASHFLOW_TRIGGER_KEYWORDS.some((keyword) => normalized.includes(keyword))
	) {
		const currency = extractCurrencyFromQuery(normalized);
		return createCashflowProjectionArtifact(currency);
	}

	if (TAX_TRIGGER_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
		const period = extractPeriodFromQuery(normalized) ?? "2026-01";
		return createTaxSummaryArtifact(period);
	}

	if (
		PAYROLL_TRIGGER_KEYWORDS.some((keyword) => normalized.includes(keyword))
	) {
		const period = extractPeriodFromQuery(normalized) ?? "2026-01";
		return createPayrollSummaryArtifact(period);
	}

	return null;
};

export const createBillsPayableArtifact = (
	_currency: CurrencyCode = "PEN",
): BillsPayableArtifact => {
	const rows = [
		{
			id: "cxp-001",
			vendor: "Servicios Cloud Perú S.A.C.",
			invoiceNumber: "F001-4599",
			amount: 12500.0,
			dueDate: "2026-02-28",
			status: "PENDING" as const,
		},
		{
			id: "cxp-002",
			vendor: "Logística Integral S.A.",
			invoiceNumber: "E001-230",
			amount: 4500.0,
			dueDate: "2026-01-15",
			status: "OVERDUE" as const,
			daysOverdue: 15,
		},
		{
			id: "cxp-003",
			vendor: "Consultora Financiera Elite",
			invoiceNumber: "F099-112",
			amount: 2300.0,
			dueDate: "2026-03-10",
			status: "APPROVAL" as const,
		},
		{
			id: "cxp-004",
			vendor: "Proveedores Unidos S.A.C.",
			invoiceNumber: "F002-887",
			amount: 890.0,
			dueDate: "2026-02-05",
			status: "PAID" as const,
		},
		{
			id: "cxp-005",
			vendor: "Telecomunicaciones Globales",
			invoiceNumber: "F020-5566",
			amount: 340.5,
			dueDate: "2026-01-20",
			status: "OVERDUE" as const,
			daysOverdue: 5,
		},
	];

	const totalPending = rows
		.filter((r) => r.status === "PENDING")
		.reduce((a, r) => a + r.amount, 0);
	const totalOverdue = rows
		.filter((r) => r.status === "OVERDUE")
		.reduce((a, r) => a + r.amount, 0);
	const totalPaid = rows
		.filter((r) => r.status === "PAID")
		.reduce((a, r) => a + r.amount, 0);

	return {
		id: generateArtifactId(),
		type: ARTIFACT_TYPES.BILLS_PAYABLE,
		version: "1.0.0",
		status: "PREVIEW",
		title: "Cuentas por pagar",
		description: "Resumen de facturas pendientes por pagar",
		metadata: createMetadata("INTERNAL"),
		data: {
			rows,
			summary: {
				totalPending,
				totalOverdue,
				totalPaid,
				count: rows.length,
			},
		},
		actions: [],
	};
};

export const createCashflowProjectionArtifact = (
	currency: CurrencyCode = "PEN",
): CashflowProjectionArtifact => {
	const projections = [
		{ period: "Ene 2026", inflow: 85000, outflow: 72000, balance: 13000 },
		{ period: "Feb 2026", inflow: 92000, outflow: 78000, balance: 27000 },
		{ period: "Mar 2026", inflow: 88000, outflow: 95000, balance: 20000 },
		{ period: "Abr 2026", inflow: 95000, outflow: 85000, balance: 30000 },
	];

	const totalInflow = projections.reduce((a, p) => a + p.inflow, 0);
	const totalOutflow = projections.reduce((a, p) => a + p.outflow, 0);

	return {
		id: generateArtifactId(),
		type: ARTIFACT_TYPES.CASHFLOW_PROJECTION,
		version: "1.0.0",
		status: "PREVIEW",
		title: "Proyección de flujo de caja",
		description: "Proyección a 4 meses de ingresos y egresos",
		metadata: createMetadata("INTERNAL"),
		data: {
			projections,
			currentBalance: 45000,
			currency,
			summary: {
				totalInflow,
				totalOutflow,
				netProjection: totalInflow - totalOutflow,
			},
		},
		actions: [],
	};
};

export const createBankingReconciliationArtifact = (
	options: {
		period?: string;
		accountName?: string;
		accountId?: string;
		currency?: CurrencyCode;
	} = {},
): BankingReconciliationArtifact => {
	const period = options.period ?? "2026-01";
	const accountName = options.accountName ?? "BCP Corriente Soles";
	const accountId = options.accountId ?? "acc-default";
	const currency = options.currency ?? "PEN";

	const rows = [
		{
			id: "rec-001",
			bankRef: "BCP-2026-001",
			description: "Transferencia entrante Cliente Minera X",
			bankAmount: 15000.0,
			ledgerAmount: 15000.0,
			difference: 0,
			status: "MATCH" as const,
			date: `${period}-05`,
		},
		{
			id: "rec-002",
			bankRef: "BKM-2026-002",
			description: "Pago proveedor AWS",
			bankAmount: 4200.0,
			ledgerAmount: 4150.0,
			difference: 50.0,
			status: "MISMATCH" as const,
			date: `${period}-08`,
		},
		{
			id: "rec-003",
			bankRef: "INT-2026-003",
			description: "Depósito efectivo sucursal",
			bankAmount: 8900.0,
			ledgerAmount: 8900.0,
			difference: 0,
			status: "MATCH" as const,
			date: `${period}-12`,
		},
		{
			id: "rec-004",
			bankRef: "BKM-2026-004",
			description: "Comisión bancaria mensual",
			bankAmount: 45.0,
			ledgerAmount: 0,
			difference: 45.0,
			status: "MISSING_IN_LEDGER" as const,
			date: `${period}-15`,
		},
		{
			id: "rec-005",
			bankRef: "—",
			description: "Nota de débito SUNAT (percepción)",
			bankAmount: 0,
			ledgerAmount: 320.0,
			difference: -320.0,
			status: "MISSING_IN_BANK" as const,
			date: `${period}-18`,
		},
	];

	const matched = rows.filter((r) => r.status === "MATCH").length;
	const mismatched = rows.filter((r) => r.status !== "MATCH").length;
	const totalBank = rows.reduce((acc, r) => acc + r.bankAmount, 0);
	const totalLedger = rows.reduce((acc, r) => acc + r.ledgerAmount, 0);
	const totalDifference = totalBank - totalLedger;

	return {
		id: generateArtifactId(),
		type: ARTIFACT_TYPES.BANKING_RECONCILIATION,
		version: "1.0.0",
		status: "PREVIEW",
		title: `Conciliación bancaria ${period}`,
		description:
			"Comparación entre movimientos bancarios y registros contables",
		metadata: createMetadata("BANK"),
		data: {
			period,
			accountId,
			accountName,
			currency,
			rows,
			summary: {
				totalBank,
				totalLedger,
				totalDifference,
				matched,
				mismatched,
			},
		},
		actions: [
			{
				id: "export-csv",
				label: "Exportar CSV",
				type: "SECONDARY" as const,
			},
		],
	};
};

export const createTaxSummaryArtifact = (
	period: string = "2026-01",
): TaxSummaryArtifact => {
	const rows = [
		{
			taxName: "IGV (18%)",
			base: 125000,
			rate: "18%",
			amount: 22500,
			status: "FILED" as const,
			dueDate: `${period}-12`,
		},
		{
			taxName: "Impuesto a la Renta 3ra",
			base: 125000,
			rate: "1.5%",
			amount: 1875,
			status: "CALCULATED" as const,
			dueDate: `${period}-20`,
		},
		{
			taxName: "ESSALUD",
			base: 85000,
			rate: "9%",
			amount: 7650,
			status: "FILED" as const,
			dueDate: `${period}-15`,
		},
		{
			taxName: "ONP",
			base: 85000,
			rate: "13%",
			amount: 11050,
			status: "PENDING" as const,
			dueDate: `${period}-15`,
		},
		{
			taxName: "ITAN",
			base: 2000000,
			rate: "0.4%",
			amount: 8000,
			status: "OVERDUE" as const,
			dueDate: `${period}-05`,
		},
	];

	const totalPayable = rows
		.filter((r) => r.status === "PENDING")
		.reduce((a, r) => a + r.amount, 0);
	const totalFiled = rows
		.filter((r) => r.status === "FILED" || r.status === "CALCULATED")
		.reduce((a, r) => a + r.amount, 0);
	const totalOverdue = rows
		.filter((r) => r.status === "OVERDUE")
		.reduce((a, r) => a + r.amount, 0);

	return {
		id: generateArtifactId(),
		type: ARTIFACT_TYPES.TAX_SUMMARY,
		version: "1.0.0",
		status: "PREVIEW",
		title: `Liquidaci\u00f3n de tributos ${period}`,
		description: "Resumen de impuestos por declarar y pagar ante SUNAT",
		metadata: createMetadata("SUNAT"),
		data: {
			period,
			rows,
			summary: {
				totalPayable,
				totalFiled,
				totalOverdue,
			},
		},
		actions: [],
	};
};

export const createPayrollSummaryArtifact = (
	period: string = "2026-01",
): PayrollSummaryArtifact => {
	const employees = [
		{
			employeeId: "emp-001",
			name: "Carlos Mendoza",
			position: "Contador Senior",
			baseSalary: 8500,
			netSalary: 6980,
			deductions: 1520,
			bonus: 500,
			status: "PAID" as const,
		},
		{
			employeeId: "emp-002",
			name: "Mar\u00eda Luna",
			position: "Asistente Contable",
			baseSalary: 3200,
			netSalary: 2720,
			deductions: 480,
			status: "PAID" as const,
		},
		{
			employeeId: "emp-003",
			name: "Jos\u00e9 Torres",
			position: "Analista Tributario",
			baseSalary: 5500,
			netSalary: 4620,
			deductions: 880,
			bonus: 300,
			status: "PENDING" as const,
		},
		{
			employeeId: "emp-004",
			name: "Ana Garc\u00eda",
			position: "Jefe de Tesorer\u00eda",
			baseSalary: 11000,
			netSalary: 8910,
			deductions: 2090,
			status: "PROCESSING" as const,
		},
	];

	const totalSalaries = employees.reduce((a, e) => a + e.baseSalary, 0);
	const totalDeductions = employees.reduce((a, e) => a + e.deductions, 0);
	const totalBonuses = employees.reduce((a, e) => a + (e.bonus ?? 0), 0);
	const totalNetPay = employees.reduce((a, e) => a + e.netSalary, 0);

	return {
		id: generateArtifactId(),
		type: ARTIFACT_TYPES.PAYROLL_SUMMARY,
		version: "1.0.0",
		status: "PREVIEW",
		title: `Planilla ${period}`,
		description: "Resumen de n\u00f3mina del periodo",
		metadata: createMetadata("INTERNAL"),
		data: {
			period,
			employees,
			summary: {
				totalSalaries,
				totalDeductions,
				totalNetPay: totalNetPay + totalBonuses - totalDeductions,
				employeeCount: employees.length,
				processedCount: employees.filter((e) => e.status === "PAID").length,
			},
		},
		actions: [],
	};
};
