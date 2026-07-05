import type { JsonSchemaLike } from "./schema-validator";

export const dataEngineSchemas = {
	health: {
		type: "object",
		required: ["status", "service"],
		properties: {
			status: { type: "string", enum: ["online", "offline"] },
			service: { type: "string" },
			version: { type: "string" },
			engine: { type: "string" },
		},
	},
	sireAnalyze: {
		type: "object",
		required: ["status"],
		properties: {
			status: { type: "string", enum: ["success", "error"] },
			recordCount: { type: "number" },
			totalAmount: { type: "number" },
			totalIGV: { type: "number" },
			errors: {
				type: "array",
				items: {
					type: "object",
					required: ["line", "field", "message"],
					properties: {
						line: { type: "number" },
						field: { type: "string" },
						message: { type: "string" },
					},
				},
			},
			warnings: {
				type: "array",
				items: {
					type: "object",
					properties: {
						line: { type: "number" },
						field: { type: "string" },
						message: { type: "string" },
					},
				},
			},
		},
	},
	cashflowAnalyze: {
		type: "object",
		required: ["status", "summary"],
		properties: {
			status: { type: "string" },
			summary: {
				type: "object",
				required: ["totalIncome", "totalExpenses", "netCashflow"],
				properties: {
					totalIncome: { type: "number" },
					totalExpenses: { type: "number" },
					netCashflow: { type: "number" },
				},
			},
		},
	},
	reconcile: {
		type: "object",
		required: ["matched", "unmatched"],
		properties: {
			matched: {
				type: "array",
				items: {
					type: "object",
					required: ["bankIndex", "systemIndex", "confidence"],
					properties: {
						bankIndex: { type: "number" },
						systemIndex: { type: "number" },
						confidence: { type: "number", minimum: 0, maximum: 1 },
					},
				},
			},
			unmatched: {
				type: "object",
				required: ["bank", "system"],
				properties: {
					bank: {
						type: "array",
						items: { type: "number" },
					},
					system: {
						type: "array",
						items: { type: "number" },
					},
				},
			},
		},
	},
} as const satisfies Record<string, JsonSchemaLike>;
