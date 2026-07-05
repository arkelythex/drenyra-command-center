import { describe, expect, it } from "vitest";
import {
	buildBatchRecords,
	getMissingVariables,
	isValidStatusTransition,
	matchesTrigger,
	substituteVariables,
} from "../client-comms.service";

describe("substituteVariables", () => {
	it("replaces {{name}} with the provided value", () => {
		const result = substituteVariables("Hola {{name}}", { name: "Juan" });
		expect(result).toBe("Hola Juan");
	});

	it("replaces multiple variables", () => {
		const result = substituteVariables("{{greeting}} {{name}}", {
			greeting: "Hola",
			name: "María",
		});
		expect(result).toBe("Hola María");
	});

	it("leaves unresolved variables intact", () => {
		const result = substituteVariables("Hola {{name}}, tu {{code}} es", {
			name: "Juan",
		});
		expect(result).toBe("Hola Juan, tu {{code}} es");
	});

	it("handles a template with no variables", () => {
		const result = substituteVariables("Mensaje sin variables", {});
		expect(result).toBe("Mensaje sin variables");
	});

	it("handles empty template", () => {
		const result = substituteVariables("", { name: "Juan" });
		expect(result).toBe("");
	});

	it("replaces the same variable used multiple times", () => {
		const result = substituteVariables("{{x}} + {{x}} = {{double}}", {
			x: "1",
			double: "2",
		});
		expect(result).toBe("1 + 1 = 2");
	});
});

describe("getMissingVariables", () => {
	it("detects a missing variable used in the body", () => {
		const missing = getMissingVariables("Hola {{name}}", [], {});
		expect(missing).toEqual(["name"]);
	});

	it("returns empty when all variables are provided", () => {
		const missing = getMissingVariables("Hola {{name}}", ["name"], {
			name: "Juan",
		});
		expect(missing).toEqual([]);
	});

	it("returns empty for a template with no variables", () => {
		const missing = getMissingVariables("Sin variables", [], {});
		expect(missing).toEqual([]);
	});

	it("flags declared-but-unused variables as missing", () => {
		const missing = getMissingVariables("Hola {{name}}", ["code"], {
			name: "Juan",
		});
		expect(missing).toEqual(["code"]);
	});

	it("reports multiple missing variables", () => {
		const missing = getMissingVariables("{{a}} {{b}} {{c}}", [], { a: "1" });
		expect(missing).toEqual(["b", "c"]);
	});

	it("does not flag variables present in provided values", () => {
		const missing = getMissingVariables("{{a}} {{b}}", ["a", "b"], {
			a: "1",
			b: "2",
		});
		expect(missing).toEqual([]);
	});
});

describe("isValidStatusTransition", () => {
	it.each([
		["queued", "sent", true],
		["queued", "failed", true],
		["queued", "delivered", false],
		["sent", "delivered", true],
		["sent", "failed", true],
		["sent", "queued", false],
		["delivered", "read", true],
		["delivered", "failed", false],
		["failed", "queued", true],
		["failed", "sent", false],
	] as const)("allows %s → %s: %s", (from, to, expected) => {
		expect(isValidStatusTransition(from, to)).toBe(expected);
	});

	it("rejects transitions for unknown statuses", () => {
		expect(isValidStatusTransition("unknown", "sent")).toBe(false);
	});

	it("rejects self-transitions when not explicitly listed", () => {
		expect(isValidStatusTransition("queued", "queued")).toBe(false);
	});
});

describe("matchesTrigger", () => {
	it("returns true when trigger matches event exactly", () => {
		expect(matchesTrigger("payment.received", "payment.received")).toBe(true);
	});

	it("returns false when trigger does not match event", () => {
		expect(matchesTrigger("payment.received", "invoice.created")).toBe(false);
	});

	it("returns false for partial match", () => {
		expect(matchesTrigger("payment", "payment.received")).toBe(false);
	});

	it("returns false for empty event", () => {
		expect(matchesTrigger("payment.received", "")).toBe(false);
	});

	it("returns false for empty trigger", () => {
		expect(matchesTrigger("", "payment.received")).toBe(false);
	});

	it("is case-sensitive by default", () => {
		expect(matchesTrigger("Payment.Received", "payment.received")).toBe(false);
	});
});

describe("buildBatchRecords", () => {
	const companyId = "550e8400-e29b-41d4-a716-446655440000";
	const templateId = "550e8400-e29b-41d4-a716-446655440001";
	const channel = "email";

	it("creates one record per client ID", () => {
		const records = buildBatchRecords(
			companyId,
			templateId,
			["c1", "c2", "c3"],
			channel,
		);
		expect(records).toHaveLength(3);
	});

	it("sets correct fields on each record", () => {
		const [record] = buildBatchRecords(companyId, templateId, ["c1"], channel, {
			code: "ABC",
		});
		expect(record).toEqual({
			companyId,
			templateId,
			clientId: "c1",
			channel,
			recipient: "",
			body: JSON.stringify({ code: "ABC" }),
			status: "queued",
		});
	});

	it("serialises empty variables as empty object", () => {
		const [record] = buildBatchRecords(companyId, templateId, ["c1"], channel);
		expect(record.body).toBe("{}");
	});

	it("assigns status queued to every record", () => {
		const records = buildBatchRecords(
			companyId,
			templateId,
			["c1", "c2"],
			channel,
		);
		for (const r of records) {
			expect(r.status).toBe("queued");
		}
	});

	it("handles a single client", () => {
		const records = buildBatchRecords(companyId, templateId, ["c1"], channel);
		expect(records).toHaveLength(1);
		expect(records[0].clientId).toBe("c1");
	});
});
