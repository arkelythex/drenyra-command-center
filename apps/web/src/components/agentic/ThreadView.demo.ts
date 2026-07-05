import type { Message } from "./ThreadView.types";

// ─── Demo Data ───────────────────────────────────────────────────────────────

export const DEMO_MESSAGES: Message[] = [
	{
		id: "demo-1",
		role: "user",
		content: "Show me the financial summary for RUC 20123456789 for March 2026",
		timestamp: new Date(Date.now() - 300_000).toISOString(),
	},
	{
		id: "demo-2",
		role: "agent",
		content: [
			"I've analyzed the financial data for **RUC 20123456789** (Minera Summa S.A.C.) for **March 2026**.",
			"",
			"Here's the summary:",
			"",
			"- **Total Ingresos**: S/ 1,234,567.89",
			"- **Total Gastos**: S/ 987,654.32",
			"- **IGV Mensual**: S/ 222,222.22",
			"- **Detracciones**: S/ 123,456.78",
			"- **Retenciones**: S/ 45,678.90",
			"",
			"The company is in _buen estado fiscal_ with all declarations up to date.",
		].join("\n"),
		timestamp: new Date(Date.now() - 240_000).toISOString(),
		toolCalls: [
			{
				id: "tc-1",
				name: "query_sunat",
				status: "completed",
				output: [
					"RUC: 20123456789",
					"Razón Social: Minera Summa S.A.C.",
					"Estado: ACTIVO",
					"Condición: HABIDO",
					"Periodo: 2026-03",
				].join("\n"),
				exitCode: 0,
			},
			{
				id: "tc-2",
				name: "analyze_financials",
				status: "completed",
				output: [
					"Periodo: 2026-03",
					"Ingresos: S/ 1,234,567.89",
					"Gastos: S/ 987,654.32",
					"IGV: S/ 222,222.22",
					"Detracciones: S/ 123,456.78",
				].join("\n"),
				exitCode: 0,
			},
		],
	},
	{
		id: "demo-3",
		role: "user",
		content: "Fix the invoice series from F001 to B001 in the last declaration",
		timestamp: new Date(Date.now() - 180_000).toISOString(),
	},
	{
		id: "demo-4",
		role: "agent",
		content: "I've updated the invoice series. Here's the diff:",
		timestamp: new Date(Date.now() - 120_000).toISOString(),
		diffs: [
			{
				filePath: "declarations/march-2026.json",
				hunks: [
					{
						oldStart: 42,
						newStart: 42,
						content: [
							'  "invoiceSeries": {',
							'-    "series": "F001",',
							'+    "series": "B001",',
							'    "type": "FACTURA",',
							'    "authorized": true',
							"  }",
						].join("\n"),
					},
				],
			},
		],
	},
	{
		id: "demo-5",
		role: "system",
		content: "✓ Declaration updated successfully. SUNAT sync pending.",
		timestamp: new Date(Date.now() - 60_000).toISOString(),
	},
];
