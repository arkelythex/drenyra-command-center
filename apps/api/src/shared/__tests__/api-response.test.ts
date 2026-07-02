import { describe, expect, it } from "vitest";
import { fail, getErrorMessage, ok } from "../api-response";
import { ErrorCodes } from "../error-codes";

describe("ok()", () => {
	it("returns success response with data", () => {
		const result = ok({ id: 1, name: "test" });
		expect(result).toEqual({
			success: true,
			data: { id: 1, name: "test" },
		});
	});

	it("returns success response with data and meta", () => {
		const result = ok([1, 2, 3], { total: 100, limit: 10, offset: 0 });
		expect(result).toEqual({
			success: true,
			data: [1, 2, 3],
			meta: { total: 100, limit: 10, offset: 0 },
		});
	});

	it("returns success response with cursor meta", () => {
		const result = ok(["a"], { cursor: "next_cursor" });
		expect(result).toEqual({
			success: true,
			data: ["a"],
			meta: { cursor: "next_cursor" },
		});
	});
});

describe("fail()", () => {
	it("returns failure response with code and message", () => {
		const result = fail("NOT_FOUND", "PR no encontrado");
		expect(result).toEqual({
			success: false,
			error: { code: "NOT_FOUND", message: "PR no encontrado" },
		});
	});

	it("returns failure response with details", () => {
		const result = fail("VALIDATION_ERROR", "Campo inválido", {
			field: "amount",
		});
		expect(result).toEqual({
			success: false,
			error: {
				code: "VALIDATION_ERROR",
				message: "Campo inválido",
				details: { field: "amount" },
			},
		});
	});

	it("returns failure response with requestId", () => {
		const result = fail("INTERNAL_ERROR", "algo explotó", undefined, "req-123");
		expect(result).toEqual({
			success: false,
			error: {
				code: "INTERNAL_ERROR",
				message: "algo explotó",
				requestId: "req-123",
			},
		});
	});

	it("returns failure response with all fields", () => {
		const result = fail(
			"RATE_LIMITED",
			"Demasiadas requests",
			{ retryAfter: 60 },
			"req-456",
		);
		expect(result).toEqual({
			success: false,
			error: {
				code: "RATE_LIMITED",
				message: "Demasiadas requests",
				details: { retryAfter: 60 },
				requestId: "req-456",
			},
		});
	});

	it("uses every error code from ErrorCodes without throwing", () => {
		const codes = Object.values(ErrorCodes);
		for (const code of codes) {
			const result = fail(code, `error ${code}`);
			expect(result.success).toBe(false);
			expect(result.error.code).toBe(code);
		}
	});
});

describe("getErrorMessage()", () => {
	it("extracts message from Error instance", () => {
		expect(getErrorMessage(new Error("algo salió mal"))).toBe("algo salió mal");
	});

	it("returns fallback for non-Error", () => {
		expect(getErrorMessage("string error")).toBe("Internal server error");
	});

	it("returns fallback for undefined", () => {
		expect(getErrorMessage(undefined)).toBe("Internal server error");
	});

	it("returns custom fallback", () => {
		expect(getErrorMessage(null, "Error personalizado")).toBe(
			"Error personalizado",
		);
	});

	it("returns fallback when Error has empty message", () => {
		expect(getErrorMessage(new Error(""), "fallback")).toBe("fallback");
	});
});
