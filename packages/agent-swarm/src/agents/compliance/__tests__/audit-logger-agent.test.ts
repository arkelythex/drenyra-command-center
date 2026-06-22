import { describe, expect, it } from "vitest";
import { auditLoggerAgent } from "../audit-logger.agent";
import type { Task } from "../../types";

function makeTask(events: unknown[]): Task {
	return {
		id: "audit-task",
		type: "audit",
		payload: {
			context: { tenantId: "tenant-1", companyId: "company-1", ruc: "20123456789" },
			events,
		},
	};
}

describe("auditLoggerAgent", () => {
	it("passes with a well-formed event", async () => {
		const result = await auditLoggerAgent.execute(makeTask([{
			id: "evt-1",
			actor: "user-1",
			action: "invoice.create",
			timestamp: "2026-05-31T10:00:00.000Z",
			traceId: "trace-1",
			evidenceRefs: ["evidence-1"],
			approvalId: "approval-1",
		}]), { immutableEvidence: true });

		expect(result.success).toBe(true);
		expect(result.data.findings).toHaveLength(0);
		expect(result.data.tamperProof).toBe(true);
	});

	it("flags an action without traceId", async () => {
		const result = await auditLoggerAgent.execute(makeTask([{
			id: "evt-2",
			actor: "user-1",
			action: "login",
			timestamp: "2026-05-31T10:00:00.000Z",
			evidenceRefs: ["evidence-2"],
		}]));

		expect(result.data.findings.some((finding) => finding.category === "missing_trace")).toBe(true);
		expect(result.data.tamperProof).toBe(false);
	});

	it("marks material actions without approval as critical", async () => {
		const result = await auditLoggerAgent.execute(makeTask([{
			id: "evt-3",
			actor: "user-1",
			action: "invoice.cancel",
			timestamp: "2026-05-31T10:00:00.000Z",
			traceId: "trace-3",
			evidenceRefs: ["evidence-3"],
		}]));

		expect(result.success).toBe(false);
		expect(result.data.findings[0].severity).toBe("critical");
	});

	it("redacts PII in output", async () => {
		const result = await auditLoggerAgent.execute(makeTask([{
			id: "evt-4",
			actor: "persona@example.com",
			action: "login",
			timestamp: "2026-05-31T10:00:00.000Z",
			traceId: "trace-4",
			evidenceRefs: ["evidence-4"],
			metadata: { token: "token=supersecret123" },
		}]));

		const output = JSON.stringify(result.data.events);
		expect(output).not.toContain("persona@example.com");
		expect(output).not.toContain("supersecret123");
	});

	it("redacts PII from the full report", async () => {
		const result = await auditLoggerAgent.execute(makeTask([{
			id: "persona@example.com",
			actor: "persona@example.com",
			action: "login",
			timestamp: "2026-05-31T10:00:00.000Z",
			traceId: "trace-4",
			evidenceRefs: ["20123456789"],
		}]));

		expect(JSON.stringify(result.data)).not.toContain("persona@example.com");
		expect(JSON.stringify(result.data)).not.toContain("20123456789");
	});

	it("flags cross-scope audit events as critical", async () => {
		const result = await auditLoggerAgent.execute(makeTask([{
			id: "evt-cross",
			actor: "user-1",
			action: "login",
			timestamp: "2026-05-31T10:00:00.000Z",
			traceId: "trace-cross",
			evidenceRefs: ["evidence-cross"],
			scope: { tenantId: "tenant-2", companyId: "company-1", ruc: "20123456789" },
		}]));

		expect(result.success).toBe(false);
		expect(result.data.findings.some((finding) => finding.category === "scope_mismatch")).toBe(true);
	});
});
