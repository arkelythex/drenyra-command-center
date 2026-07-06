import { Elysia } from "elysia";
import { TransactionService } from "../banking/application/services/transaction.service";
import { IngestBankSchema } from "./agentic-ledger.schemas";
import { AgenticLedgerService } from "./agentic-ledger.service";
import { AgenticLedgerWasmSkillService } from "./wasm-skill/agentic-ledger-wasm-skill.service";
import { IngestBankWithWasmSchema } from "./wasm-skill/wasm-bank-skill.schemas";
import { companyScopeGuard } from "../shared/plugins";

const service = new AgenticLedgerService(new TransactionService());
const wasmSkillService = new AgenticLedgerWasmSkillService(
	new TransactionService(),
);

/**
 * Agentic Ledger Elysia module (Perú-first).
 *
 * Provides ingestion endpoints that feed the Agentic Ledger system-of-record.
 * Mounted under `/api/agentic-ledger`.
 *
 * @example
 * ```ts
 * import { Elysia } from "elysia";
 * import { agenticLedgerModule } from "./features/agentic-ledger";
 *
 * const app = new Elysia().use(agenticLedgerModule);
 * ```
 */
export const agenticLedgerModule = new Elysia({ prefix: "/api/agentic-ledger" })
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.post(
		"/ingest/bank",
		async ({ body, set }) => {
			try {
				const { imported, duplicates, warnings } =
					await service.ingestBank(body);
				return { imported, duplicates, warnings };
			} catch (error) {
				set.status = 400;
				return {
					message:
						error instanceof Error ? error.message : "Invalid ingest request",
				};
			}
		},
		{
			body: IngestBankSchema,
			detail: {
				tags: ["Agentic Ledger"],
				summary: "Ingest bank transactions (Perú v1)",
				description:
					"Importa transacciones bancarias (CSV/normalizadas) para alimentar el Agentic Ledger.",
			},
		},
	)
	.post(
		"/ingest/bank/wasm-skill",
		async ({ body, set }) => {
			try {
				const result = await wasmSkillService.ingestWithWasm(body);
				return { success: true, data: result };
			} catch (error) {
				set.status = 400;
				return {
					success: false,
					error:
						error instanceof Error
							? error.message
							: "Invalid WASM skill request",
				};
			}
		},
		{
			body: IngestBankWithWasmSchema,
			detail: {
				tags: ["Agentic Ledger"],
				summary: "Ingest bank CSV with custom WASM skill sandbox",
				description:
					"Ejecuta skill WASM aislada para transformar filas bancarias antes del import (zero-trust sandbox).",
			},
		},
	);

export default agenticLedgerModule;
