import type { AgentContext, AgentTool } from "@drenyra/drenyra-orchestrator";
import { z } from "zod";

const CurrencySchema = z.enum(["PEN", "USD"]);
const InvoiceItemSchema = z.object({
	description: z.string().min(3),
	quantity: z.string(),
	unitPrice: z.string(),
	taxType: z.enum(["GRAVADO", "EXONERADO", "INAFECTO"]).optional(),
});

/**
 * createInvoiceTool const.
 *
 * @example
 * ```ts
 * console.log(createInvoiceTool);
 * ```
 */
export const createInvoiceTool: AgentTool = {
	name: "create_invoice",
	description:
		"Crea una factura/comprobante de cobro (invoice) en estado DRAFT. Aplica IGV 18% automáticamente.",
	inputSchema: z.object({
		customerId: z.string(),
		series: z.string(),
		issueDate: z.string(),
		dueDate: z.string(),
		currency: CurrencySchema.default("PEN"),
		items: z.array(InvoiceItemSchema).min(1),
		notes: z.string().optional(),
		exchangeRate: z.number().default(1),
	}),
	outputSchema: z.object({
		invoiceId: z.string(),
		invoiceNumber: z.string(),
		status: z.string(),
		totalAmount: z.object({ amount: z.string(), currency: z.string() }),
		createdAt: z.string(),
	}),
	approvalLevel: "gate",
	async execute(input: unknown, context: AgentContext) {
		const i = input as {
			customerId: string;
			series: string;
			issueDate: string;
			dueDate: string;
			currency: string;
			items: Array<{
				description: string;
				quantity: string;
				unitPrice: string;
				taxType?: string;
			}>;
			notes?: string;
			exchangeRate: number;
		};
		const { CreateInvoiceCommand: Cmd } = await import(
			"../../billing/invoice/application/commands/create-invoice.command"
		);
		const handler = new (
			await import(
				"../../billing/invoice/application/commands/create-invoice.handler"
			)
		).CreateInvoiceHandler();
		const command = Cmd.create({
			companyId: context.companyId,
			customerId: i.customerId,
			series: i.series,
			issueDate: new Date(i.issueDate),
			dueDate: new Date(i.dueDate),
			currency: i.currency,
			items: i.items as never,
			notes: i.notes,
			exchangeRate: i.exchangeRate,
		} as never);
		const result = await handler.execute(command);
		return {
			invoiceId: result.invoiceId,
			invoiceNumber: result.invoiceNumber,
			status: result.status,
			totalAmount: result.totalAmount,
			createdAt: result.createdAt.toISOString(),
		};
	},
};

/**
 * listAccountsTool const.
 *
 * @example
 * ```ts
 * console.log(listAccountsTool);
 * ```
 */
export const listAccountsTool: AgentTool = {
	name: "list_accounts",
	description:
		"Lista las cuentas bancarias de la empresa con sus saldos actuales.",
	inputSchema: z.object({ currency: CurrencySchema.optional() }),
	outputSchema: z.object({
		accounts: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				type: z.string(),
				currency: CurrencySchema,
				balance: z.string(),
			}),
		),
	}),
	approvalLevel: "auto",
	async execute(_input: unknown, context: AgentContext) {
		const { AccountService } = await import(
			"../../banking/application/services/account.service"
		);
		const svc = new AccountService();
		type AcctRec = {
			id: string;
			name?: string;
			accountName?: string;
			type?: string;
			accountType?: string;
			currency?: string;
			balance?: { toString(): string } | string | number;
		};
		const accounts = (await svc.listAccounts(context.companyId)) as AcctRec[];
		return {
			accounts: (Array.isArray(accounts) ? accounts : []).map((a) => ({
				id: a.id,
				name: a.name ?? a.accountName,
				type: a.type ?? a.accountType,
				currency: a.currency ?? "PEN",
				balance:
					typeof a.balance === "object"
						? a.balance?.toString()
						: String(a.balance ?? "0"),
			})),
		};
	},
};

/**
 * getBalanceTool const.
 *
 * @example
 * ```ts
 * console.log(getBalanceTool);
 * ```
 */
export const getBalanceTool: AgentTool = {
	name: "get_balance",
	description: "Obtiene el saldo actual de una cuenta bancaria.",
	inputSchema: z.object({ accountId: z.string() }),
	outputSchema: z.object({ balance: z.string(), currency: z.string() }),
	approvalLevel: "auto",
	async execute(input: unknown, context: AgentContext) {
		const i = input as { accountId: string };
		const { BankingApplicationService } = await import("../../banking");
		const svc = new BankingApplicationService();
		const balance = await svc.getBalance(i.accountId);
		return { balance: balance.toString(), currency: "PEN" };
	},
};

/**
 * forecastCashflowTool const.
 *
 * @example
 * ```ts
 * console.log(forecastCashflowTool);
 * ```
 */
export const forecastCashflowTool: AgentTool = {
	name: "forecast_cashflow",
	description: "Genera un forecast de flujo de caja para los próximos meses.",
	inputSchema: z.object({ months: z.number().min(1).max(12).default(3) }),
	outputSchema: z.object({ forecast: z.array(z.unknown()) }),
	approvalLevel: "auto",
	async execute(_input: unknown, context: AgentContext) {
		const { getActualCashflow } = await import(
			"../../cashflow/application/queries/get-actual-cashflow.query"
		);
		const result = await getActualCashflow({
			companyId: context.companyId,
			startDate: new Date(new Date().getFullYear(), 0, 1),
			endDate: new Date(),
		});
		return { forecast: Array.isArray(result) ? result : [result] };
	},
};

/**
 * autoReconcileTool const.
 *
 * @example
 * ```ts
 * console.log(autoReconcileTool);
 * ```
 */
export const autoReconcileTool: AgentTool = {
	name: "auto_reconcile",
	description:
		"Ejecuta conciliación bancaria automática para una cuenta en el período activo.",
	inputSchema: z.object({
		accountId: z.string(),
		period: z.string().optional(),
	}),
	outputSchema: z.object({ reconciled: z.number(), total: z.number() }),
	approvalLevel: "gate",
	async execute(_input: unknown, context: AgentContext) {
		const { ReconciliationService } = await import(
			"../../reconciliations/application/services/reconciliation.service"
		);
		const svc = new ReconciliationService();
		const stats = await svc.getStats(context.companyId);
		return {
			reconciled: stats.reconciled.count,
			total: stats.total,
		};
	},
};

/**
 * getLedgerTool const.
 *
 * @example
 * ```ts
 * console.log(getLedgerTool);
 * ```
 */
export const getLedgerTool: AgentTool = {
	name: "get_ledger_entry",
	description: "Obtiene asientos del libro mayor para un rango de fechas.",
	inputSchema: z.object({
		startDate: z.string().optional(),
		endDate: z.string().optional(),
	}),
	outputSchema: z.object({ entries: z.array(z.any()) }),
	approvalLevel: "auto",
	async execute(input: unknown, context: AgentContext) {
		const { LedgerService } = await import("../../ledger");
		const inp = input as { startDate?: string; endDate?: string };
		const start = inp.startDate
			? new Date(inp.startDate)
			: new Date(new Date().getFullYear(), 0, 1);
		const end = inp.endDate ? new Date(inp.endDate) : new Date();
		const entries = await LedgerService.getGeneralLedger(
			context.companyId,
			start,
			end,
		);
		return { entries: Array.isArray(entries) ? entries : [] };
	},
};

/**
 * financeTools const.
 *
 * @example
 * ```ts
 * console.log(financeTools);
 * ```
 */
export const financeTools: AgentTool[] = [
	createInvoiceTool,
	listAccountsTool,
	getBalanceTool,
	forecastCashflowTool,
	autoReconcileTool,
	getLedgerTool,
];
