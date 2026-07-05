import { t } from "elysia";
import { BankCsvFormatSchema } from "../agentic-ledger.schemas";

/**
 * WasmBankSkillConfigSchema const.
 *
 * @example
 * ```ts
 * console.log(WasmBankSkillConfigSchema);
 * ```
 */
export const WasmBankSkillConfigSchema = t.Object({
	moduleBase64: t.String({ minLength: 16 }),
	includeExport: t.Optional(t.String({ minLength: 1, maxLength: 64 })),
	transformAmountExport: t.Optional(t.String({ minLength: 1, maxLength: 64 })),
	transformTypeExport: t.Optional(t.String({ minLength: 1, maxLength: 64 })),
	timeoutMs: t.Optional(t.Number({ minimum: 100, maximum: 10_000 })),
	maxRows: t.Optional(t.Number({ minimum: 1, maximum: 20_000 })),
});

/**
 * IngestBankWithWasmSchema const.
 *
 * @example
 * ```ts
 * console.log(IngestBankWithWasmSchema);
 * ```
 */
export const IngestBankWithWasmSchema = t.Object({
	companyId: t.String({ format: "uuid" }),
	accountId: t.String({ format: "uuid" }),
	csvText: t.String({ minLength: 10 }),
	format: t.Optional(
		t.Union([BankCsvFormatSchema, t.String({ minLength: 1, maxLength: 40 })]),
	),
	wasmSkill: WasmBankSkillConfigSchema,
});
