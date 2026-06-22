import { afterEach, describe, expect, it, vi } from "vitest";
import { registerCorporateUser } from "../register-corporate-user";

describe("registerCorporateUser", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns the server success message when signup succeeds", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(
				JSON.stringify({
					success: true,
					data: {
						message:
							"Cuenta creada exitosamente. Revisa tu email para verificar tu cuenta.",
					},
				}),
				{ status: 200 },
			),
		);

		await expect(
			registerCorporateUser({
				email: "test@empresa.com",
				password: "SecurePass123",
				name: "Juan Perez",
				ruc: "20608451231",
			}),
		).resolves.toContain("Cuenta creada exitosamente");
	});

	it("throws a typed error when the corporate signup API rejects the request", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(
				JSON.stringify({
					success: false,
					error: "Este RUC ya está registrado",
					code: "RUC_EXISTS",
					field: "ruc",
				}),
				{ status: 409 },
			),
		);

		await expect(
			registerCorporateUser({
				email: "test@empresa.com",
				password: "SecurePass123",
				name: "Juan Perez",
				ruc: "20608451231",
			}),
		).rejects.toMatchObject({
			name: "RegisterCorporateUserError",
			message: "Este RUC ya está registrado",
			code: "RUC_EXISTS",
			field: "ruc",
		});
	});
});
