/**
 * MockBankAdapter Contract Tests
 *
 * Runs the shared BankProviderAdapter contract suite against MockBankAdapter.
 */

import { describe } from "vitest";
import { MockBankAdapter } from "../../infrastructure/mock-bank.adapter";
import { testBankProviderAdapter } from "./provider-adapter.contract";

describe("MockBankAdapter Contract", () => {
	testBankProviderAdapter(
		"MockBankAdapter",
		() =>
			new MockBankAdapter({
				accountCount: 3,
				transactionCount: 5,
				seed: 42,
			}),
		{
			username: "any-user",
			password: "any-pass",
		},
	);
});
