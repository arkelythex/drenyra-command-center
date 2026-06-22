import { describe, expect, it } from "vitest";
import { presentError } from "../error-messages";

describe("presentError", () => {
	it("maps backend tenant codes to accountant-friendly Spanish messages", () => {
		expect(presentError(new Error("COMPANY_SCOPE_REQUIRED"), "Fallback")).toMatchObject({
			title: "Selecciona una empresa activa",
			code: "COMPANY_SCOPE_REQUIRED",
		});
	});

	it("maps banking resource errors to contextual Spanish messages", () => {
		expect(presentError(new Error("ACCOUNT_NOT_FOUND"), "Fallback")).toMatchObject({
			title: "No se encontró la cuenta bancaria",
			code: "ACCOUNT_NOT_FOUND",
		});
	});

	it("preserves fallback title while keeping the raw description for unknown errors", () => {
		expect(presentError(new Error("trace unavailable"), "No se pudo cargar")).toMatchObject({
			title: "No se pudo cargar",
			description: "trace unavailable",
		});
	});
});
