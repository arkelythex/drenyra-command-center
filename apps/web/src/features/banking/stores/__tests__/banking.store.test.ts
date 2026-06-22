import { beforeEach, describe, expect, it } from "vitest";

import { useBankingStore } from "../banking.store";
import { initialState } from "../banking.store.types";

describe("useBankingStore", () => {
	beforeEach(() => {
		useBankingStore.setState(initialState);
	});

	it("starts with UI-only banking state", () => {
		expect(useBankingStore.getState()).toMatchObject({
			selectedAccountId: null,
			lastReconciliationResult: null,
		});
	});

	it("stores and clears the selected account", () => {
		useBankingStore.getState().selectAccount("acc-2");
		expect(useBankingStore.getState().selectedAccountId).toBe("acc-2");

		useBankingStore.getState().clearSelectedAccount();
		expect(useBankingStore.getState().selectedAccountId).toBeNull();
	});

	it("stores and clears reconciliation preview state", () => {
		const result = {
			companyId: "comp-1",
			accountId: "acc-2",
			reconciledCount: 3,
			matches: [
				{
					transactionId: "tx-1",
					documentId: "inv-1",
					documentType: "INVOICE" as const,
					matchScore: 97,
					matchCriteria: "REFERENCE",
				},
			],
		};

		useBankingStore.getState().setLastReconciliationResult(result);
		expect(useBankingStore.getState().lastReconciliationResult).toEqual(result);

		useBankingStore.getState().clearLastReconciliationResult();
		expect(useBankingStore.getState().lastReconciliationResult).toBeNull();
	});

	it("resets the store to its initial UI state", () => {
		useBankingStore.setState({
			selectedAccountId: "acc-1",
			lastReconciliationResult: {
				companyId: "comp-1",
				accountId: "acc-1",
				reconciledCount: 1,
				matches: [],
			},
		});

		useBankingStore.getState().reset();

		expect(useBankingStore.getState()).toMatchObject(initialState);
	});
});
