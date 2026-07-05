import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KpiDashboard } from "../KpiDashboard";

vi.mock("@/lib/utils", () => ({
	cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
	n: (value: number) =>
		`S/ ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
}));

vi.mock("lucide-react", () => {
	const icon = (name: string) =>
		function MockIcon(props: Record<string, unknown>) {
			return <span data-testid={`lucide-${name}`} {...props} />;
		};
	return {
		TrendingUp: icon("TrendingUp"),
		TrendingDown: icon("TrendingDown"),
		Minus: icon("Minus"),
		DollarSign: icon("DollarSign"),
		Percent: icon("Percent"),
		CalendarDays: icon("CalendarDays"),
		Hash: icon("Hash"),
	};
});

// ─── Default state from accounting store ──────────────────────────────────────

const DEFAULT_KPI_METRICS = [
	{
		id: "kpi-1",
		label: "Liquidez Corriente",
		value: 1.85,
		previousValue: 1.72,
		variance: 7.6,
		trend: "up" as const,
		format: "number" as const,
	},
	{
		id: "kpi-2",
		label: "Margen Neto",
		value: 12.4,
		previousValue: 11.8,
		variance: 5.1,
		trend: "up" as const,
		format: "percentage" as const,
	},
	{
		id: "kpi-3",
		label: "Días de Cobranza",
		value: 45,
		previousValue: 52,
		variance: -13.5,
		trend: "up" as const,
		format: "days" as const,
	},
	{
		id: "kpi-4",
		label: "ROE",
		value: 18.2,
		previousValue: 19.1,
		variance: -4.7,
		trend: "down" as const,
		format: "percentage" as const,
	},
	{
		id: "kpi-5",
		label: "Efectivo disponible",
		value: 2840000,
		previousValue: 3100000,
		variance: -8.4,
		trend: "down" as const,
		format: "currency" as const,
	},
];

vi.mock("@/stores/accounting-store", () => ({
	useAccountingStore: (selector: (s: Record<string, unknown>) => unknown) =>
		selector({
			kpiMetrics: DEFAULT_KPI_METRICS,
			getActiveCompany: () => ({
				id: "comp-1",
				name: "TechCorp Perú SAC",
				ruc: "20123456789",
			}),
			getActivePeriod: () => ({
				id: "per-2026-04",
				label: "Abril 2026",
				year: 2026,
				month: 4,
				isClosed: false,
				startDate: "2026-04-01",
				endDate: "2026-04-30",
			}),
		}),
}));

describe("KpiDashboard", () => {
	it("renders header with title", () => {
		render(<KpiDashboard />);
		expect(screen.getByText("KPIs Financieros")).toBeInTheDocument();
	});

	it("renders active company and period", () => {
		render(<KpiDashboard />);
		expect(screen.getByText(/TechCorp Perú SAC/i)).toBeInTheDocument();
		expect(screen.getByText(/Abril 2026/i)).toBeInTheDocument();
	});

	it("renders all KPI metrics", () => {
		render(<KpiDashboard />);
		expect(screen.getByText("Liquidez Corriente")).toBeInTheDocument();
		expect(screen.getByText("Margen Neto")).toBeInTheDocument();
		expect(screen.getByText("Días de Cobranza")).toBeInTheDocument();
		expect(screen.getByText("ROE")).toBeInTheDocument();
		expect(screen.getByText("Efectivo disponible")).toBeInTheDocument();
	});

	it("renders formatted KPI values", () => {
		render(<KpiDashboard />);
		// Number format
		expect(screen.getByText("1.85")).toBeInTheDocument();
		// Percentage format
		expect(screen.getByText("12.4%")).toBeInTheDocument();
		// Days format
		expect(screen.getByText("45 días")).toBeInTheDocument();
	});

	it("renders trend indicators in footer", () => {
		render(<KpiDashboard />);
		expect(screen.getByText(/Mejora vs período anterior/i)).toBeInTheDocument();
		expect(
			screen.getByText(/Deterioro vs período anterior/i),
		).toBeInTheDocument();
	});

	it("renders variance percentages", () => {
		render(<KpiDashboard />);
		expect(screen.getByText("+7.6%")).toBeInTheDocument();
		expect(screen.getByText("+5.1%")).toBeInTheDocument();
		expect(screen.getByText("-13.5%")).toBeInTheDocument();
	});

	it('renders "vs." comparison text for each metric', () => {
		render(<KpiDashboard />);
		// Multiple metrics show "vs. S/ X" or "vs. X%"
		const vsElements = screen.getAllByText(/vs\./);
		expect(vsElements.length).toBeGreaterThan(0);
	});
});
