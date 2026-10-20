import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
	fetchBankAccounts: vi.fn(),
	createBankAccount: vi.fn(),
	importStatement: vi.fn(),
}));

vi.mock("../../services/bank-statement-import", () => api);

vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: () => ({ companyContext: { companyId: "cmp-1" } }),
}));

import {
	formatCents,
	StatementImportDialog,
} from "../sections/StatementImportDialog";

const CSV = [
	"Fecha;Descripción;Monto;Referencia",
	"10/09/2026;ABONO F001-77;1.180,00;000123",
	"11/09/2026;COMISION;-12,50;",
].join("\n");

function renderDialog() {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<QueryClientProvider client={client}>
			<StatementImportDialog />
		</QueryClientProvider>,
	);
}

async function chooseFile(content: string) {
	const input = screen.getByLabelText("Archivo CSV");
	const file = new File([content], "extracto.csv", { type: "text/csv" });
	fireEvent.change(input, { target: { files: [file] } });
	await screen.findByRole("button", { name: "Importar 2 movimientos" });
}

describe("StatementImportDialog", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		api.fetchBankAccounts.mockResolvedValue([
			{
				id: "acc-1",
				bankName: "BCP",
				accountName: "Corriente",
				accountNumber: "191-1234567-0-12",
				currency: "PEN",
			},
		]);
		api.importStatement.mockResolvedValue({ imported: 2, skipped: 0 });
	});

	it("sends the statement in cents to the selected account", async () => {
		renderDialog();
		fireEvent.click(screen.getByRole("button", { name: /importar extracto/i }));
		await screen.findByRole("option", { name: /BCP · Corriente/ });

		await chooseFile(CSV);
		fireEvent.click(
			screen.getByRole("button", { name: "Importar 2 movimientos" }),
		);

		await waitFor(() =>
			expect(api.importStatement).toHaveBeenCalledWith("cmp-1", "acc-1", [
				{
					date: "2026-09-10",
					description: "ABONO F001-77",
					reference: "000123",
					type: "CREDIT",
					amountCents: 118000,
				},
				{
					date: "2026-09-11",
					description: "COMISION",
					type: "DEBIT",
					amountCents: 1250,
				},
			]),
		);
		expect(api.createBankAccount).not.toHaveBeenCalled();
	});

	it("creates the account first when there is none", async () => {
		api.fetchBankAccounts.mockResolvedValue([]);
		api.createBankAccount.mockResolvedValue({ id: "acc-new" });
		renderDialog();
		fireEvent.click(screen.getByRole("button", { name: /importar extracto/i }));

		const bank = await screen.findByLabelText("Banco");
		fireEvent.change(bank, { target: { value: "BBVA" } });
		fireEvent.change(screen.getByLabelText("Nombre de la cuenta"), {
			target: { value: "Soles" },
		});
		fireEvent.change(screen.getByLabelText("Número de cuenta"), {
			target: { value: "0011-0123-0100012345" },
		});
		await chooseFile(CSV);
		fireEvent.click(
			screen.getByRole("button", { name: "Importar 2 movimientos" }),
		);

		await waitFor(() =>
			expect(api.importStatement).toHaveBeenCalledWith(
				"cmp-1",
				"acc-new",
				expect.any(Array),
			),
		);
		expect(api.createBankAccount).toHaveBeenCalledWith("cmp-1", {
			bankName: "BBVA",
			accountName: "Soles",
			accountNumber: "0011-0123-0100012345",
			currency: "PEN",
		});
	});
});

describe("formatCents", () => {
	it("formats without a float", () => {
		expect(formatCents(123456789)).toBe("S/ 1,234,567.89");
		expect(formatCents(-5)).toBe("-S/ 0.05");
	});
});
