import { afterEach, describe, expect, it } from "vitest";
import { evaluateSireSubmissionPolicy } from "../../services/sire-policy-2026.service";

const ORIGINAL_ENV = {
	SIRE_POLICY_REFERENCE_DATE: process.env.SIRE_POLICY_REFERENCE_DATE,
	SIRE_2026_POSTPONED_UNTIL: process.env.SIRE_2026_POSTPONED_UNTIL,
	SIRE_2026_PRICO_INCOME_THRESHOLD_PEN:
		process.env.SIRE_2026_PRICO_INCOME_THRESHOLD_PEN,
};

function restoreEnv(): void {
	const assign = (key: string, value: string | undefined) => {
		if (value === undefined) {
			delete process.env[key];
			return;
		}
		process.env[key] = value;
	};

	assign("SIRE_POLICY_REFERENCE_DATE", ORIGINAL_ENV.SIRE_POLICY_REFERENCE_DATE);
	assign("SIRE_2026_POSTPONED_UNTIL", ORIGINAL_ENV.SIRE_2026_POSTPONED_UNTIL);
	assign(
		"SIRE_2026_PRICO_INCOME_THRESHOLD_PEN",
		ORIGINAL_ENV.SIRE_2026_PRICO_INCOME_THRESHOLD_PEN,
	);
}

describe("evaluateSireSubmissionPolicy", () => {
	afterEach(() => {
		restoreEnv();
	});

	it("defers submission for PRICO before June 2026 cutoff", () => {
		process.env.SIRE_POLICY_REFERENCE_DATE = "2026-05-20T12:00:00.000Z";
		process.env.SIRE_2026_POSTPONED_UNTIL = "2026-06-01";

		const result = evaluateSireSubmissionPolicy({
			period: "2026-05",
			isPrico: true,
		});

		expect(result.isDeferred).toBe(true);
		expect(result.appliesToCompany).toBe(true);
		expect(result.reason).toContain("2026-06-01");
	});

	it("defers submission when annual income passes PRICO threshold", () => {
		process.env.SIRE_POLICY_REFERENCE_DATE = "2026-05-15T12:00:00.000Z";
		process.env.SIRE_2026_PRICO_INCOME_THRESHOLD_PEN = "3500000";

		const result = evaluateSireSubmissionPolicy({
			period: "2026-05",
			companyAnnualIncomePen: 3_600_000,
		});

		expect(result.appliesToCompany).toBe(true);
		expect(result.isDeferred).toBe(true);
	});

	it("does not defer submission after cutoff date", () => {
		process.env.SIRE_POLICY_REFERENCE_DATE = "2026-06-10T00:00:00.000Z";
		process.env.SIRE_2026_POSTPONED_UNTIL = "2026-06-01";

		const result = evaluateSireSubmissionPolicy({
			period: "2026-06",
			isPrico: true,
		});

		expect(result.appliesToCompany).toBe(true);
		expect(result.isDeferred).toBe(false);
	});
});
