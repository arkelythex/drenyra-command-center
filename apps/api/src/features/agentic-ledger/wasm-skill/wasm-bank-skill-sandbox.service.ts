import type { ImportTransactionInput } from "../agentic-ledger.service";

/**
 * WasmBankSkillConfig interface.
 *
 * @example
 * ```ts
 * const value: WasmBankSkillConfig = {} as WasmBankSkillConfig;
 * console.log(value);
 * ```
 */
export interface WasmBankSkillConfig {
	moduleBase64: string;
	includeExport?: string;
	transformAmountExport?: string;
	transformTypeExport?: string;
	timeoutMs?: number;
	maxRows?: number;
}

/**
 * WasmBankSkillExecution interface.
 *
 * @example
 * ```ts
 * const value: WasmBankSkillExecution = {} as WasmBankSkillExecution;
 * console.log(value);
 * ```
 */
export interface WasmBankSkillExecution {
	processedRows: number;
	skippedRows: number;
	durationMs: number;
	timeoutMs: number;
}

/**
 * WasmBankSkillResult interface.
 *
 * @example
 * ```ts
 * const value: WasmBankSkillResult = {} as WasmBankSkillResult;
 * console.log(value);
 * ```
 */
export interface WasmBankSkillResult {
	transactions: ImportTransactionInput[];
	execution: WasmBankSkillExecution;
}

const DEFAULT_TIMEOUT_MS = 1200;
const DEFAULT_MAX_ROWS = 5000;
const DEFAULT_MAX_MODULE_BYTES = 256 * 1024;

type WasmNumericFn = (left: number, right: number) => number;

function toPositiveInt(raw: number | undefined, fallback: number): number {
	if (!Number.isFinite(raw) || (raw as number) < 1) return fallback;
	return Math.floor(raw as number);
}

function getEnvPositiveInt(name: string, fallback: number): number {
	const raw = Number(process.env[name] ?? fallback);
	return toPositiveInt(raw, fallback);
}

function toTypeCode(type: ImportTransactionInput["type"]): number {
	return type === "DEBIT" ? 0 : 1;
}

function fromTypeCode(
	code: number,
	fallback: ImportTransactionInput["type"],
): ImportTransactionInput["type"] {
	if (code === 0) return "DEBIT";
	if (code === 1) return "CREDIT";
	return fallback;
}

function decodeModuleBase64(base64: string): Uint8Array {
	try {
		return Buffer.from(base64, "base64");
	} catch {
		throw new Error("Invalid WASM module encoding. Expected base64.");
	}
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
	const copy = new Uint8Array(bytes.byteLength);
	copy.set(bytes);
	return copy.buffer;
}

function resolveExportFunction(
	exportsRecord: WebAssembly.Exports,
	name: string | undefined,
): WasmNumericFn | undefined {
	if (!name) return undefined;
	const candidate = exportsRecord[name];
	if (typeof candidate !== "function") {
		throw new Error(`WASM export "${name}" is not available.`);
	}

	return candidate as unknown as WasmNumericFn;
}

function ensureWithinBudget(deadline: number): void {
	if (Date.now() > deadline) {
		throw new Error("WASM_SKILL_TIMEOUT");
	}
}

/**
 * WasmBankSkillSandboxService class.
 *
 * @example
 * ```ts
 * const value = new WasmBankSkillSandboxService();
 * console.log(value);
 * ```
 */
export class WasmBankSkillSandboxService {
	async transformTransactions(
		transactions: ImportTransactionInput[],
		config: WasmBankSkillConfig,
	): Promise<WasmBankSkillResult> {
		const startedAt = Date.now();
		const timeoutMs = toPositiveInt(config.timeoutMs, DEFAULT_TIMEOUT_MS);
		const maxRows = toPositiveInt(
			config.maxRows,
			getEnvPositiveInt("WASM_SKILL_MAX_ROWS", DEFAULT_MAX_ROWS),
		);
		const maxModuleBytes = getEnvPositiveInt(
			"WASM_SKILL_MAX_MODULE_BYTES",
			DEFAULT_MAX_MODULE_BYTES,
		);

		if (transactions.length > maxRows) {
			throw new Error(
				`WASM skill row budget exceeded (${transactions.length}/${maxRows}).`,
			);
		}

		const moduleBytes = decodeModuleBase64(config.moduleBase64);
		if (moduleBytes.byteLength > maxModuleBytes) {
			throw new Error(
				`WASM module exceeds size limit (${moduleBytes.byteLength}/${maxModuleBytes} bytes).`,
			);
		}

		const deadline = startedAt + timeoutMs;
		ensureWithinBudget(deadline);

		const imports = {
			env: {
				now_ms: () => Date.now(),
			},
		};

		const wasmModule = await WebAssembly.compile(toArrayBuffer(moduleBytes));
		const wasmInstance = await WebAssembly.instantiate(wasmModule, imports);
		const includeFn = resolveExportFunction(
			wasmInstance.exports,
			config.includeExport ?? "include",
		);
		const transformAmountFn = resolveExportFunction(
			wasmInstance.exports,
			config.transformAmountExport ?? "transform_amount",
		);
		const transformTypeFn = resolveExportFunction(
			wasmInstance.exports,
			config.transformTypeExport ?? "transform_type",
		);

		const transformed: ImportTransactionInput[] = [];
		let skipped = 0;

		for (const row of transactions) {
			ensureWithinBudget(deadline);

			const amountCents = Math.round(row.amount * 100);
			const typeCode = toTypeCode(row.type);

			if (includeFn) {
				const includeValue = Number(includeFn(amountCents, typeCode));
				if (!Number.isFinite(includeValue) || includeValue <= 0) {
					skipped += 1;
					continue;
				}
			}

			let nextAmountCents = amountCents;
			if (transformAmountFn) {
				const transformedAmount = Number(
					transformAmountFn(amountCents, typeCode),
				);
				if (!Number.isFinite(transformedAmount)) {
					throw new Error("WASM transform_amount returned non-numeric value.");
				}
				nextAmountCents = Math.round(transformedAmount);
			}

			let nextType = row.type;
			if (transformTypeFn) {
				const transformedTypeCode = Number(
					transformTypeFn(amountCents, typeCode),
				);
				if (!Number.isFinite(transformedTypeCode)) {
					throw new Error("WASM transform_type returned non-numeric value.");
				}
				nextType = fromTypeCode(Math.round(transformedTypeCode), row.type);
			}

			transformed.push({
				...row,
				type: nextType,
				amount: Number((Math.abs(nextAmountCents) / 100).toFixed(2)),
			});
		}

		return {
			transactions: transformed,
			execution: {
				processedRows: transformed.length,
				skippedRows: skipped,
				durationMs: Date.now() - startedAt,
				timeoutMs,
			},
		};
	}
}
