import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	list: vi.fn(),
	create: vi.fn(),
	lookupRuc: vi.fn(),
}));

vi.mock("@/features/customers/api/customers.api", () => ({
	customersApi: { list: mocks.list, create: mocks.create },
}));
vi.mock("@/features/onboarding/services/company-onboarding", () => ({
	lookupRuc: mocks.lookupRuc,
}));
vi.mock("@/lib/monitoring", () => ({ captureError: vi.fn() }));

import { CustomerSelector } from "../CustomerSelector";

function renderSelector() {
	const onSelect = vi.fn();
	render(
		<CustomerSelector
			selectedCustomer={null}
			onSelect={onSelect}
			companyId="cmp-1"
		/>,
	);
	return onSelect;
}

function search(text: string) {
	fireEvent.change(
		screen.getByPlaceholderText("Buscar por RUC o Razón Social..."),
		{
			target: { value: text },
		},
	);
}

describe("CustomerSelector: registering a new customer", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.list.mockResolvedValue([]);
		mocks.lookupRuc.mockResolvedValue({ legalName: "NUEVO S.A.C." });
	});

	it("offers to register the RUC that was not found, fills SUNAT's name and selects it", async () => {
		mocks.create.mockResolvedValue({
			id: "c-2",
			companyId: "cmp-1",
			taxId: "20100070970",
			legalName: "NUEVO S.A.C.",
		});
		const onSelect = renderSelector();
		search("20100070970");

		fireEvent.click(
			await screen.findByRole("button", { name: "Registrar cliente" }),
		);

		expect(screen.getByLabelText("RUC del cliente")).toHaveValue("20100070970");
		await waitFor(() =>
			expect(screen.getByLabelText("Razón social del cliente")).toHaveValue(
				"NUEVO S.A.C.",
			),
		);
		fireEvent.click(screen.getByRole("button", { name: "Guardar cliente" }));

		await waitFor(() =>
			expect(onSelect).toHaveBeenCalledWith({
				id: "c-2",
				taxId: "20100070970",
				legalName: "NUEVO S.A.C.",
			}),
		);
		expect(mocks.create).toHaveBeenCalledWith({
			companyId: "cmp-1",
			taxId: "20100070970",
			legalName: "NUEVO S.A.C.",
		});
	});

	it("starts from the name when the search was not a RUC", async () => {
		renderSelector();
		search("Bodega Rosa");

		fireEvent.click(
			await screen.findByRole("button", { name: "Registrar cliente" }),
		);

		expect(screen.getByLabelText("RUC del cliente")).toHaveValue("");
		expect(screen.getByLabelText("Razón social del cliente")).toHaveValue(
			"Bodega Rosa",
		);
		expect(
			screen.getByRole("button", { name: "Guardar cliente" }),
		).toBeDisabled();
	});

	it("shows why the customer was refused and keeps the form", async () => {
		mocks.create.mockRejectedValue(
			new Error("Ya existe un cliente con ese RUC en la empresa"),
		);
		const onSelect = renderSelector();
		search("20100070970");
		fireEvent.click(
			await screen.findByRole("button", { name: "Registrar cliente" }),
		);
		await waitFor(() =>
			expect(screen.getByLabelText("Razón social del cliente")).toHaveValue(
				"NUEVO S.A.C.",
			),
		);

		fireEvent.click(screen.getByRole("button", { name: "Guardar cliente" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Ya existe un cliente con ese RUC",
		);
		expect(onSelect).not.toHaveBeenCalled();
	});
});
