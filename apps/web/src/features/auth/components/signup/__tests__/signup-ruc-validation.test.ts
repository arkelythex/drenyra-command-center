import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRucValidation } from "../signup-ruc-validation";

// Valid RUC (passes @drenyra/shared's Módulo 11 checksum) — real RUC used
// elsewhere in this module's own pre-existing (now removed) mock dictionary.
const VALID_RUC = "20100070970";
// Same length, fails the checksum.
const INVALID_RUC = "20123456780";

describe("useRucValidation", () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("stays idle for a RUC shorter than Peru's 11-digit length", async () => {
		const { result } = renderHook(({ ruc }) => useRucValidation(ruc), {
			initialProps: { ruc: "123456789" },
		});

		expect(result.current.status).toBe("idle");
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("calls the real /api/sunat/validate-ruc-online endpoint and uses razonSocial for a valid RUC", async () => {
		fetchMock.mockResolvedValue({
			json: async () => ({
				success: true,
				data: { valid: true, razonSocial: "TELEFONICA DEL PERU SAA" },
			}),
		});

		const { result } = renderHook(({ ruc }) => useRucValidation(ruc), {
			initialProps: { ruc: VALID_RUC },
		});

		await waitFor(() => expect(result.current.status).toBe("valid"), {
			timeout: 2000,
		});

		expect(result.current.companyName).toBe("TELEFONICA DEL PERU SAA");
		expect(fetchMock).toHaveBeenCalledWith(
			"/api/sunat/validate-ruc-online",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ ruc: VALID_RUC }),
			}),
		);
	});

	it("falls back to a generic label when the lookup has no razonSocial (e.g. server-side local-validation fallback)", async () => {
		fetchMock.mockResolvedValue({
			json: async () => ({
				success: true,
				data: {
					valid: true,
					message: "RUC válido (validación local - API no disponible)",
				},
			}),
		});

		const { result } = renderHook(({ ruc }) => useRucValidation(ruc), {
			initialProps: { ruc: VALID_RUC },
		});

		await waitFor(() => expect(result.current.status).toBe("valid"), {
			timeout: 2000,
		});

		expect(result.current.companyName).toBe("Empresa Válida");
	});

	it("falls back to a generic label when the lookup fails outright (network/API error)", async () => {
		fetchMock.mockRejectedValue(new Error("network error"));

		const { result } = renderHook(({ ruc }) => useRucValidation(ruc), {
			initialProps: { ruc: VALID_RUC },
		});

		await waitFor(() => expect(result.current.status).toBe("valid"), {
			timeout: 2000,
		});

		expect(result.current.companyName).toBe("Empresa Válida");
	});

	it("marks an invalid RUC (failed Módulo 11 checksum) as invalid without calling the lookup endpoint", async () => {
		const { result } = renderHook(({ ruc }) => useRucValidation(ruc), {
			initialProps: { ruc: INVALID_RUC },
		});

		await waitFor(() => expect(result.current.status).toBe("invalid"), {
			timeout: 2000,
		});

		expect(result.current.error).toBe("RUC inválido (verificación módulo 11)");
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
