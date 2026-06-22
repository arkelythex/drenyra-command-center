import { BankingApplicationService } from "../../application/services/banking.application-service";
import {
	BankingRepository,
	type BankTransactionRecord,
} from "../../infrastructure/banking.repository";

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
 * Result returned by bank-transaction scoped loaders.
 *
 * @example
 * ```ts
 * if (result.ok) await service.reconcileTransaction(result.transaction.id, userId);
 * ```
 */
export type ScopedBankTransactionLoadResult =
	| {
			ok: true;
			companyId: string;
			transaction: BankTransactionRecord;
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

/**
 * Loads a bank transaction and verifies that its stored company matches caller scope.
 *
 * @param transactionId - Banking transaction identifier from the route path.
 * @param companyId - Resolved tenant company identifier.
 * @returns Scoped transaction result or fail-closed API error metadata.
 * @throws Re-throws unexpected transaction lookup errors.
 * @example
 * ```ts
 * const scoped = await loadScopedBankTransaction(transactionId, companyContext.companyId);
 * ```
 */
export async function loadScopedBankTransaction(
	transactionId: string,
	companyId: string,
): Promise<ScopedBankTransactionLoadResult> {
	const transaction = await new BankingRepository().findTransactionById(
		transactionId,
	);
	if (!transaction) {
		return {
			ok: false,
			error: "Transaccion bancaria no encontrada",
			code: "TRANSACTION_NOT_FOUND",
			status: 404,
		};
	}

	if (transaction.companyId !== companyId) {
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
		transaction,
	};
}
