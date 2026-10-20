import { api } from "@/lib/api-client";
import { extractOkData, unwrap } from "@/lib/api-helpers";
import type { StatementRow } from "./statement-csv";

/** Row of `GET /api/banking/accounts`. */
export interface BankAccountDto {
	id: string;
	accountName: string;
	accountNumber: string;
	bankName: string;
	currency: string;
}

export interface NewBankAccount {
	bankName: string;
	accountName: string;
	accountNumber: string;
	currency: "PEN" | "USD";
}

/** Body of `POST /api/banking/import`. */
export interface StatementImportResult {
	imported: number;
	skipped: number;
}

export async function fetchBankAccounts(
	companyId: string,
): Promise<BankAccountDto[]> {
	const envelope = await unwrap(
		api.api.banking.accounts.get({ query: { companyId } }),
	);
	return extractOkData<BankAccountDto[]>(
		envelope,
		"No se pudieron cargar las cuentas bancarias",
	);
}

export async function createBankAccount(
	companyId: string,
	account: NewBankAccount,
): Promise<BankAccountDto> {
	const envelope = await unwrap(
		api.api.banking.accounts.post({
			companyId,
			...account,
			accountType: "CHECKING",
		}),
	);
	return extractOkData<BankAccountDto>(
		envelope,
		"No se pudo crear la cuenta bancaria",
	);
}

/** Sends the parsed rows; the API skips the ones already imported. */
export async function importStatement(
	companyId: string,
	accountId: string,
	transactions: StatementRow[],
): Promise<StatementImportResult> {
	const envelope = await unwrap(
		api.api.banking.import.post({ companyId, accountId, transactions }),
	);
	return extractOkData<StatementImportResult>(
		envelope,
		"No se pudo importar el extracto",
	);
}
