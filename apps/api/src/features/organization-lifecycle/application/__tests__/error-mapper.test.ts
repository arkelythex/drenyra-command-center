import { describe, expect, it } from "vitest";
import { mapUseCaseError } from "../error-mapper";

describe("mapUseCaseError", () => {
	it('maps "RUC checksum validation failed" to 400 INVALID_RUC', () => {
		const result = mapUseCaseError(new Error("RUC checksum validation failed"));
		expect(result).toEqual({
			status: 400,
			body: { success: false, error: "RUC checksum validation failed", code: "INVALID_RUC" },
		});
	});

	it('maps "RUC must be exactly 11 digits" to 400 INVALID_RUC', () => {
		const result = mapUseCaseError(new Error("RUC must be exactly 11 digits"));
		expect(result.status).toBe(400);
		expect(result.body.code).toBe("INVALID_RUC");
	});

	it('maps "Organization name is required" to 400 INVALID_NAME', () => {
		const result = mapUseCaseError(new Error("Organization name is required"));
		expect(result).toEqual({
			status: 400,
			body: { success: false, error: "Organization name is required", code: "INVALID_NAME" },
		});
	});

	it('maps "Slug must be in kebab-case format" to 400 INVALID_SLUG', () => {
		const result = mapUseCaseError(new Error("Slug must be in kebab-case format"));
		expect(result.status).toBe(400);
		expect(result.body.code).toBe("INVALID_SLUG");
	});

	it('maps "RUC already exists" to 409 RUC_ALREADY_EXISTS', () => {
		const result = mapUseCaseError(new Error("RUC already exists in this tenant"));
		expect(result).toEqual({
			status: 409,
			body: {
				success: false,
				error: "RUC already exists in this tenant",
				code: "RUC_ALREADY_EXISTS",
			},
		});
	});

	it('maps "slug already exists" to 409 SLUG_ALREADY_EXISTS', () => {
		const result = mapUseCaseError(new Error("slug already exists in this tenant"));
		expect(result.status).toBe(409);
		expect(result.body.code).toBe("SLUG_ALREADY_EXISTS");
	});

	it('maps "not found" to 404 CLIENT_NOT_FOUND', () => {
		const result = mapUseCaseError(new Error("Organization not found"));
		expect(result).toEqual({
			status: 404,
			body: { success: false, error: "Organization not found", code: "CLIENT_NOT_FOUND" },
		});
	});

	it('maps "tenant scope" to 403 TENANT_SCOPE_VIOLATION', () => {
		const result = mapUseCaseError(
			new Error("Organization does not belong to the firm's tenant scope"),
		);
		expect(result).toEqual({
			status: 403,
			body: {
				success: false,
				error: "Organization does not belong to the firm's tenant scope",
				code: "TENANT_SCOPE_VIOLATION",
			},
		});
	});

	it('maps "Cannot transition from" to 409 INVALID_TRANSITION', () => {
		const result = mapUseCaseError(
			new Error('Cannot transition from "SUSPENDED" to "SUSPENDED"'),
		);
		expect(result).toEqual({
			status: 409,
			body: {
				success: false,
				error: 'Cannot transition from "SUSPENDED" to "SUSPENDED"',
				code: "INVALID_TRANSITION",
			},
		});
	});

	it('maps unknown errors to 500 INTERNAL_ERROR', () => {
		const result = mapUseCaseError(new Error("Something unexpected happened"));
		expect(result).toEqual({
			status: 500,
			body: { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
		});
	});

	it("handles non-Error values with fallback message", () => {
		const result = mapUseCaseError("string error");
		expect(result).toEqual({
			status: 500,
			body: { success: false, error: "Internal server error", code: "INTERNAL_ERROR" },
		});
	});
});
