import { describe, expect, it } from "vitest";
import { dataClassifierAgent } from "../data-classifier.agent";
import type { Task } from "../../types";

function task(data: Record<string, unknown>): Task {
	return { id: "classify", type: "classification", payload: { context: { tenantId: "tenant-1" }, data } };
}

describe("dataClassifierAgent", () => {
	it("detects RUC", async () => {
		const result = await dataClassifierAgent.execute(task({ ruc: "20123456789" }));
		expect(result.data.classifications[0].categories).toContain("pii");
		expect(result.data.classifications[0].categories).toContain("fiscal_sensitive");
	});

	it("detects bank account data", async () => {
		const result = await dataClassifierAgent.execute(task({ accountNumber: "001122334455667788" }));
		expect(result.data.classifications[0].categories).toContain("financial");
	});

	it("detects token data", async () => {
		const result = await dataClassifierAgent.execute(task({ secret: "token=supersecret123" }));
		expect(result.success).toBe(false);
		expect(result.data.classifications[0].categories).toContain("restricted");
	});

	it("does not overclassify public text", async () => {
		const result = await dataClassifierAgent.execute(task({ title: "Monthly product update" }));
		expect(result.data.classifications).toHaveLength(0);
		expect(result.data.unclassified).toEqual(["title"]);
	});

	it("returns redaction recommendations", async () => {
		const result = await dataClassifierAgent.execute(task({ email: "persona@example.com" }));
		expect(result.data.recommendations.join(" ")).toContain("Redact");
	});

	it("redacts sensitive field names and values from the full report", async () => {
		const result = await dataClassifierAgent.execute({
			id: "classify-fields",
			type: "classification",
			payload: {
				context: { tenantId: "tenant-1" },
				fields: ["persona@example.com", "token=supersecret123"],
			},
		});

		const output = JSON.stringify(result.data);
		expect(output).not.toContain("persona@example.com");
		expect(output).not.toContain("supersecret123");
	});
});
