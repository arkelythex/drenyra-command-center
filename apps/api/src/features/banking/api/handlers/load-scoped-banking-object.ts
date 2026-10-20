import { BankingApplicationService } from "../../application/services/banking.application-service";

type BankAccountRecord = NonNullable<
	Awaited<ReturnType<BankingApplicationService["getAccount"]>>
>;

type ScopedBankingObjectFailure = {
	ok: false;
	error: string;
	code: string;
	status: 400 | 403 | 404;
};

/**
 * Result returned by bank-account scoped loaders.
 *
 * @example
 * ```ts
 * if (!result.ok) return fail(result.error, result.code);
 * ```
 */
export type ScopedBankAccountLoadResult =
	| {
			ok: true;
			companyId: string;
			account: BankAccountRecord;
	  }
	| ScopedBankingObjectFailure;

/**
 * Loads a bank account and verifies that its stored company matches caller scope.
 *
 * @param accountId - Bank account identifier from the route path.
 * @param companyId - Resolved tenant company identifier.
 * @returns Scoped account result or fail-closed API error metadata.
 * @throws Re-throws unexpected account lookup errors.
 * @example
 * ```ts
 * const scoped = await loadScopedBankAccount(accountId, companyContext.companyId);
 * ```
 */
export async function loadScopedBankAccount(
	accountId: string,
	companyId: string,
): Promise<ScopedBankAccountLoadResult> {
	const account = await new BankingApplicationService().getAccount(accountId);
	if (!account) {
		return {
			ok: false,
			error: "Cuenta bancaria no encontrada",
			code: "ACCOUNT_NOT_FOUND",
			status: 404,
		};
	}

	if (account.companyId !== companyId) {
		return {
			ok: false,
			error: "Requested companyId does not match caller tenant scope",
			code: "TENANT_SCOPE_VIOLATION",
			status: 403,
		};
	}

	return {
		ok: true,
		companyId,
		account,
	};
}
