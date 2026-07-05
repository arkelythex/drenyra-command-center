import type {
	ActualCashflowData,
	CashflowProjectionData,
	CashflowProjectionItem,
	CashflowVarianceData,
} from "../api/cashflow.api";
import type { CashflowTask, ColumnId } from "../types/cashflow-types";
import { COLUMN_ORDER, COLUMN_TITLES } from "./cashflow-constants";

export function findColumnForTask(
	columns: Record<ColumnId, string[]>,
	taskId: string,
): ColumnId | null {
	for (const [columnId, taskIds] of Object.entries(columns)) {
		if (taskIds.includes(taskId)) {
			return columnId as ColumnId;
		}
	}
	return null;
}

export function formatDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function formatTaskDate(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;

	const today = new Date();
	const todayKey = formatDate(today);
	const tomorrow = new Date(today);
	tomorrow.setDate(today.getDate() + 1);

	const dateKey = formatDate(date);
	if (dateKey < todayKey) return "Vencido";
	if (dateKey === todayKey) return "Hoy";
	if (dateKey === formatDate(tomorrow)) return "Mañana";

	return new Intl.DateTimeFormat("es-PE", {
		day: "2-digit",
		month: "short",
	}).format(date);
}

export function getDaysUntil(dateValue: string): number {
	const target = new Date(dateValue);
	const today = new Date();
	const targetUtc = Date.UTC(
		target.getFullYear(),
		target.getMonth(),
		target.getDate(),
	);
	const todayUtc = Date.UTC(
		today.getFullYear(),
		today.getMonth(),
		today.getDate(),
	);
	return Math.round((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));
}

export function mapPriority(
	item: CashflowProjectionItem,
): CashflowTask["priority"] {
	const daysUntil = getDaysUntil(item.dueDate);
	if (item.status === "overdue" || Math.abs(item.amount) >= 10000)
		return "HIGH";
	if (daysUntil <= 7) return "MEDIUM";
	return "LOW";
}

export function mapColumn(item: CashflowProjectionItem): ColumnId {
	if (item.status === "paid") return "completed";
	if (item.status === "overdue") return "audit";
	if (getDaysUntil(item.dueDate) <= 7) return "pending";
	return "scheduled";
}

export function buildProjectionTasks(
	projection: CashflowProjectionData,
): CashflowTask[] {
	return [...projection.inflows, ...projection.outflows].map((item) => ({
		id: item.id,
		title: `${item.type === "inflow" ? "Cobro" : "Pago"} ${item.reference} · ${item.customerOrVendor}`,
		amount: item.amount,
		date: formatTaskDate(item.dueDate),
		type: item.type === "inflow" ? "INCOME" : "EXPENSE",
		priority: mapPriority(item),
	}));
}

export function buildRemoteColumns(
	projection: CashflowProjectionData,
): Record<ColumnId, string[]> {
	const columns = createEmptyColumns();

	for (const item of [...projection.inflows, ...projection.outflows]) {
		columns[mapColumn(item)].push(item.id);
	}

	return columns;
}

export function createEmptyColumns(): Record<ColumnId, string[]> {
	return {
		pending: [],
		audit: [],
		scheduled: [],
		completed: [],
	};
}

export function buildBoardState(
	tasks: Record<string, CashflowTask>,
	columnTaskIds: Record<ColumnId, string[]>,
): import("../types/cashflow-types").BoardState {
	return {
		columns: {
			pending: {
				id: "pending",
				title: COLUMN_TITLES.pending,
				taskIds: columnTaskIds.pending,
			},
			audit: {
				id: "audit",
				title: COLUMN_TITLES.audit,
				taskIds: columnTaskIds.audit,
			},
			scheduled: {
				id: "scheduled",
				title: COLUMN_TITLES.scheduled,
				taskIds: columnTaskIds.scheduled,
			},
			completed: {
				id: "completed",
				title: COLUMN_TITLES.completed,
				taskIds: columnTaskIds.completed,
			},
		},
		tasks,
		columnOrder: COLUMN_ORDER,
	};
}

export function indexTasks(
	tasks: CashflowTask[],
): Record<string, CashflowTask> {
	return Object.fromEntries(tasks.map((task) => [task.id, task]));
}

export function buildVarianceFallback(
	projection: CashflowProjectionData,
	actual: ActualCashflowData,
): CashflowVarianceData {
	const inflowsVariance = round2(
		actual.actualInflows - projection.summary.totalInflows,
	);
	const outflowsVariance = round2(
		actual.actualOutflows - projection.summary.totalOutflows,
	);
	const netVariance = round2(
		actual.netCashflow - projection.summary.netCashflow,
	);

	return {
		companyId: actual.companyId,
		period: actual.period,
		currency: actual.currency,
		projected: {
			inflows: projection.summary.totalInflows,
			outflows: projection.summary.totalOutflows,
			netCashflow: projection.summary.netCashflow,
		},
		actual: {
			inflows: actual.actualInflows,
			outflows: actual.actualOutflows,
			netCashflow: actual.netCashflow,
		},
		variance: {
			inflows: inflowsVariance,
			outflows: outflowsVariance,
			netCashflow: netVariance,
			inflowsPercentage: percentage(
				inflowsVariance,
				projection.summary.totalInflows,
			),
			outflowsPercentage: percentage(
				outflowsVariance,
				projection.summary.totalOutflows,
			),
			netPercentage: percentage(netVariance, projection.summary.netCashflow),
		},
		alerts: [],
	};
}

export function percentage(delta: number, base: number): number {
	if (base === 0) return 0;
	return round2((delta / base) * 100);
}

export function round2(value: number): number {
	return Math.round(value * 100) / 100;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export function toNumericBalance(
	value: string | number | undefined,
): number | null {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
}

export function extractTotalBalance(payload: unknown): number {
	if (!isRecord(payload)) return 0;

	const summary = payload as Record<string, unknown>;
	if (summary.success === true && typeof summary.data !== "undefined") {
		return extractTotalBalance(summary.data);
	}

	return (
		toNumericBalance(summary.totalBalance as string | number | undefined) ??
		toNumericBalance(summary.totalBalancePEN as string | number | undefined) ??
		0
	);
}
