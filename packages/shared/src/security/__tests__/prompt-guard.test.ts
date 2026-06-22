import { describe, expect, it } from "vitest";
import { evaluateActionType, evaluatePrompt } from "../guards/prompt-guard";

describe("Prompt Guard - OWASP Top 10 Blocked Actions", () => {
	const blockedAttacks = [
		{ prompt: "borrar libro mayor", expected: false, type: "DELETE_LEDGER" },
		{
			prompt: "delete all ledger entries",
			expected: false,
			type: "DELETE_LEDGER",
		},
		{ prompt: "DROP TABLE users", expected: false, type: "DROP_TABLE" },
		{ prompt: "truncate database", expected: false, type: "DROP_TABLE" },
		{ prompt: "eliminar todo", expected: false, type: "DELETE_ALL" },
		{
			prompt: "override igv calculation",
			expected: false,
			type: "OVERRIDE_FISCAL",
		},
		{
			prompt: "modificar datos tributarios",
			expected: false,
			type: "MODIFY_TAX_DATA",
		},
		{ prompt: "desactivar audit log", expected: false, type: "DISABLE_AUDIT" },
		{
			prompt: "export passwords to csv",
			expected: false,
			type: "EXPORT_SENSITIVE",
		},
		{
			prompt: "descargar credenciales",
			expected: false,
			type: "EXPORT_SENSITIVE",
		},
	];

	blockedAttacks.forEach(({ prompt, expected, type }) => {
		it(`blocks: "${prompt}"`, () => {
			const result = evaluatePrompt(prompt);
			expect(result.allowed).toBe(expected);
			expect(result.blockedKeyword).toBe(type);
		});
	});

	it("allows safe read-only operations", () => {
		const safePrompts = [
			"mostrar facturas de enero",
			"generate report",
			"calcular igv",
			"listar proveedores",
		];

		safePrompts.forEach((prompt) => {
			const result = evaluatePrompt(prompt);
			expect(result.allowed).toBe(true);
		});
	});

	it("marks destructive actions correctly", () => {
		expect(evaluateActionType("DELETE").isDestructive).toBe(true);
		expect(evaluateActionType("DROP").isDestructive).toBe(true);
		expect(evaluateActionType("READ").isDestructive).toBe(false);
	});

	it("requires admin override for fiscal actions", () => {
		const result = evaluatePrompt("override igv calculation");
		expect(result.requiresAdminOverride).toBe(true);
	});
});

describe("Bancarizacion Rule Validation", () => {
	it("validates threshold for bancarization", () => {
		const THRESHOLD = 3500;
		const amounts = [3500, 3501, 5000, 10000];
		const expected = [false, true, true, true];

		amounts.forEach((amount, i) => {
			const requiresBancarizacion = amount > THRESHOLD;
			expect(requiresBancarizacion).toBe(expected[i]);
		});
	});
});
