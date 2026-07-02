import type { PeriodOption } from "./WorkspaceSelector.types";

/** Default periods for the current fiscal year */
export const DEFAULT_PERIODS: PeriodOption[] = [
	{ value: "2026-07", label: "Julio 2026", isActive: true },
	{ value: "2026-06", label: "Junio 2026", isActive: false },
	{ value: "2026-05", label: "Mayo 2026" },
	{ value: "2026-04", label: "Abril 2026" },
	{ value: "2026-03", label: "Marzo 2026" },
	{ value: "2026-02", label: "Febrero 2026" },
	{ value: "2026-01", label: "Enero 2026" },
];

export const DEFAULT_MOCK_ORGS = [
	{
		id: "org-1",
		name: "Andrés Capital SAC",
		ruc: "20123456789",
		status: "active" as const,
	},
	{
		id: "org-2",
		name: "Nova SAC",
		ruc: "20987654321",
		status: "active" as const,
	},
	{
		id: "org-3",
		name: "Luna EIRL",
		ruc: "20456789123",
		status: "active" as const,
	},
];
