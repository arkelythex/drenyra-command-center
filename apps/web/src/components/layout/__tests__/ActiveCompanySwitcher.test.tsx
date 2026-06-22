import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { getCompanyContext } from "@/lib/company-context";
import { ActiveCompanySwitcher } from "../ActiveCompanySwitcher";

describe("ActiveCompanySwitcher", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("renders the active company context when only one company is available", () => {
		localStorage.setItem(
			"arkelythex-auth",
			JSON.stringify({
				state: {
					user: {
						companyId: "cmp-1",
						companyName: "LOGISTICA REAL S.A.C.",
						ruc: "20123456789",
					},
				},
			}),
		);

		render(<ActiveCompanySwitcher />);

		expect(screen.getByText("LOGISTICA REAL S.A.C.")).toBeInTheDocument();
		expect(screen.getByText("RUC 20123456789")).toBeInTheDocument();
		expect(
			screen.queryByRole("combobox", { name: "Seleccionar empresa activa" }),
		).not.toBeInTheDocument();
	});

	it("switches the active company when multiple memberships are available", () => {
		localStorage.setItem(
			"arkelythex-auth",
			JSON.stringify({
				state: {
					user: {
						companyId: "cmp-1",
						companyName: "LOGISTICA REAL S.A.C.",
						ruc: "20123456789",
						availableCompanies: [
							{
								companyId: "cmp-1",
								companyName: "LOGISTICA REAL S.A.C.",
								ruc: "20123456789",
							},
							{
								companyId: "cmp-2",
								companyName: "GRUPO BETA S.A.C.",
								ruc: "20567891234",
							},
						],
					},
				},
			}),
		);

		render(<ActiveCompanySwitcher compact />);

		fireEvent.change(
			screen.getByRole("combobox", { name: "Seleccionar empresa activa" }),
			{ target: { value: "cmp-2" } },
		);

		expect(getCompanyContext()).toEqual({
			companyId: "cmp-2",
			companyName: "GRUPO BETA S.A.C.",
			ruc: "20567891234",
			countryCode: "pe",
			isDemoFallback: false,
		});
	});
});
