import type { CompanyContext } from "../../../../../shared/plugins";
import type { Bill } from "../../domain/bill.entity";
import { BillRepository } from "../../infrastructure/bill.repository";

export type ScopedBillLoadResult =
	| {
			ok: true;
			companyId: string;
			bill: Bill;
	  }
	| {
			ok: false;
			error: string;
			code: string;
			status: 400 | 403 | 404;
	  };

export async function loadScopedBill(
	billId: string,
	companyContext: CompanyContext | undefined,
): Promise<ScopedBillLoadResult> {
	if (!companyContext) {
		return {
			ok: false,
			error: "Company context is required",
			code: "COMPANY_CONTEXT_REQUIRED",
			status: 400,
		};
	}
	const bill = await new BillRepository().findById(billId);
	if (!bill) {
		return {
			ok: false,
			error: "Bill not found",
			code: "BILL_NOT_FOUND",
			status: 404,
		};
	}

	if (bill.companyId !== companyContext.companyId) {
		return {
			ok: false,
			error: "Requested companyId does not match caller tenant scope",
			code: "TENANT_SCOPE_VIOLATION",
			status: 403,
		};
	}

	return {
		ok: true,
		companyId: companyContext.companyId,
		bill,
	};
}
