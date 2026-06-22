import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardTenantCard } from "../DashboardTenantCard";

describe("DashboardTenantCard", () => {
	it("renders the seeded demo badge when using fallback context", () => {
		render(
			<DashboardTenantCard
				companyContext={{
					companyId: "00000000-0000-0000-0000-000000000001",
					companyName: "NEBULA OPERACIONES LOGISTICAS S.A.C.",
					ruc: "20608451231",
					isDemoFallback: true,
				}}
			/>,
		);

		expect(screen.getByText("NEBULA OPERACIONES LOGISTICAS S.A.C.")).toBeInTheDocument();
		expect(screen.getByText("Demo Seed")).toBeInTheDocument();
		expect(screen.getByText("RUC: 20608451231")).toBeInTheDocument();
	});

	it("renders a company selector when multiple companies are available", () => {
		const onSelectCompany = vi.fn();

		render(
			<DashboardTenantCard
				companyContext={{
					companyId: "cmp-1",
					companyName: "NEBULA OPERACIONES LOGISTICAS S.A.C.",
					ruc: "20608451231",
					isDemoFallback: false,
				}}
				availableCompanies={[
					{
						companyId: "cmp-1",
						companyName: "NEBULA OPERACIONES LOGISTICAS S.A.C.",
						ruc: "20608451231",
						isDemoFallback: false,
					},
					{
						companyId: "cmp-2",
						companyName: "GRUPO BETA S.A.C.",
						ruc: "20567891234",
						isDemoFallback: false,
					},
				]}
				onSelectCompany={onSelectCompany}
			/>,
		);

		const selector = screen.getByRole("combobox", { name: "Empresa activa" });
		fireEvent.change(selector, { target: { value: "cmp-2" } });

		expect(onSelectCompany).toHaveBeenCalledWith("cmp-2");
	});
});
