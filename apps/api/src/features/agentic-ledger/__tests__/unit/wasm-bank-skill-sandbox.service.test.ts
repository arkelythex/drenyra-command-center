import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WasmBankSkillSandboxService } from "../../wasm-skill/wasm-bank-skill-sandbox.service";

describe("WasmBankSkillSandboxService", () => {
	const sandbox = new WasmBankSkillSandboxService();
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.restoreAllMocks();
	});

	it("rejects oversized wasm module", async () => {
		process.env.WASM_SKILL_MAX_MODULE_BYTES = "8";
		const oversized = Buffer.from(new Uint8Array(32)).toString("base64");

		await expect(
			sandbox.transformTransactions(
				[
					{
						date: new Date("2026-02-19"),
						description: "A",
						amount: 10,
						type: "CREDIT",
					},
				],
				{
					moduleBase64: oversized,
				},
			),
		).rejects.toThrow(/exceeds size limit/i);
	});

	it("applies wasm exports to include/transform rows", async () => {
		const mockModule = { mock: true } as unknown as WebAssembly.Module;
		vi.spyOn(WebAssembly, "compile").mockResolvedValue(mockModule);
		vi.spyOn(WebAssembly, "instantiate").mockResolvedValue({
			exports: {
				include: (amountCents: number) => (amountCents >= 500 ? 1 : 0),
				transform_amount: (amountCents: number) => amountCents + 100,
				transform_type: (_amountCents: number, typeCode: number) =>
					typeCode === 1 ? 0 : 1,
			},
		} as unknown as WebAssembly.Instance);

		const moduleBase64 = Buffer.from(
			new Uint8Array([0, 97, 115, 109]),
		).toString("base64");
		const result = await sandbox.transformTransactions(
			[
				{
					date: new Date("2026-02-19"),
					description: "skip me",
					amount: 1,
					type: "CREDIT",
				},
				{
					date: new Date("2026-02-19"),
					description: "keep me",
					amount: 10,
					type: "CREDIT",
				},
			],
			{ moduleBase64 },
		);

		expect(result.transactions).toHaveLength(1);
		expect(result.transactions[0]).toEqual(
			expect.objectContaining({
				description: "keep me",
				amount: 11,
				type: "DEBIT",
			}),
		);
		expect(result.execution.skippedRows).toBe(1);
	});
});
