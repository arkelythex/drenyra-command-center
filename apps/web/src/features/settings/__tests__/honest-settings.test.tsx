import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../components/SettingsShell", () => ({
	SettingsShell: ({
		title,
		description,
		children,
	}: {
		title: string;
		description: string;
		children: ReactNode;
	}) => (
		<div>
			<h1>{title}</h1>
			<p>{description}</p>
			{children}
		</div>
	),
}));
vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: () => ({
		companyContext: {
			companyId: "c1",
			companyName: "Andina S.A.C.",
			ruc: "20123456789",
			countryCode: "PE",
		},
	}),
}));

import { BillingSettings } from "../components/BillingSettings";
import { NotificationsSettings } from "../components/NotificationsSettings";
import { OrganizationSettings } from "../components/OrganizationSettings";
import { SecuritySettings } from "../components/SecuritySettings";

const INVENTED =
	/enterprise|2048|tokyo|bogotá|92%|arkalythix|corporate platinum|upgrade plan|verified entity/i;

describe.each([
	["Facturación", BillingSettings],
	["Seguridad", SecuritySettings],
	["Notificaciones", NotificationsSettings],
])("%s settings", (title, Page) => {
	it("says it is not available yet instead of showing invented data", () => {
		const { container } = render(<Page />);

		expect(
			screen.getByRole("heading", { level: 1, name: title }),
		).toBeInTheDocument();
		expect(screen.getByText(/aún no está disponible/i)).toBeInTheDocument();
		expect(container.textContent).not.toMatch(INVENTED);
		expect(screen.queryByRole("switch")).not.toBeInTheDocument();
	});
});

describe("Organization settings", () => {
	it("shows the real active company and no invented team", () => {
		const { container } = render(<OrganizationSettings />);

		expect(screen.getByText("Andina S.A.C.")).toBeInTheDocument();
		expect(screen.getByText(/RUC 20123456789/)).toBeInTheDocument();
		expect(container.textContent).not.toMatch(INVENTED);
		expect(
			screen.getByText(/gestión de equipo aún no está disponible/i),
		).toBeInTheDocument();
	});
});
