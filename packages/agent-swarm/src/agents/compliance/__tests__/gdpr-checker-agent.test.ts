import { describe, expect, it } from "vitest";
import { gdprCheckerAgent } from "../gdpr-checker.agent";
import type { Task } from "../../types";

function task(data: Record<string, unknown>): Task {
	return { id: "gdpr", type: "gdpr", payload: { context: { tenantId: "tenant-1" }, data } };
}

describe("gdprCheckerAgent", () => {
	it("detects missing lawful basis", async () => {
		const result = await gdprCheckerAgent.execute(task({ purposes: ["billing"] }));
		expect(result.success).toBe(false);
		expect(result.data.violations[0].requirement).toBe("lawful_basis");
	});

	it("detects excess data", async () => {
		const result = await gdprCheckerAgent.execute(task({ lawfulBasis: "contract", purposes: ["billing"], dataMinimized: false }));
		expect(result.data.checks.some((check) => check.requirement === "data_minimization" && check.status === "partial")).toBe(true);
	});

	it("respects fiscal evidence exception", async () => {
		const result = await gdprCheckerAgent.execute(task({ fiscalEvidence: true, purposes: ["tax"], requestedRights: ["deletion"] }));
		expect(result.data.checks.some((check) => check.status === "exception")).toBe(true);
	});

	it("generates a global score", async () => {
		const result = await gdprCheckerAgent.execute(task({ lawfulBasis: "contract", purposes: ["billing"], requestedRights: ["access"], breachNotificationReady: true }));
		expect(result.data.score).toBeGreaterThan(70);
	});

	it("merges top-level GDPR inputs when payload data exists", async () => {
		const result = await gdprCheckerAgent.execute({
			id: "gdpr-merge",
			type: "gdpr",
			payload: {
				context: { tenantId: "tenant-1" },
				data: { title: "Public product update" },
				lawfulBasis: "contract",
				purposes: ["billing"],
			},
		});

		expect(result.data.violations.some((check) => check.requirement === "lawful_basis")).toBe(false);
	});
});
