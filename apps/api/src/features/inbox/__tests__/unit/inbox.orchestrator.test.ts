import { describe, expect, it, vi } from "vitest";
import { InvoiceOrchestrator } from "../../inbox.orchestrator";
import type { InboxSseEvent } from "../../inbox.types";

vi.mock("../../../../services/inbox.service", () => ({
	InboxService: {
		processUpload: vi.fn().mockResolvedValue({ id: "tx-1" }),
	},
}));

describe("InvoiceOrchestrator", () => {
	it("emits agent pipeline and batch:complete for a valid XML", async () => {
		const events: InboxSseEvent[] = [];
		const orchestrator = new InvoiceOrchestrator((event) => events.push(event));

		const xml = `<?xml version="1.0"?>
<Invoice xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>20123456786</cbc:ID>
  <cbc:LineExtensionAmount>100.00</cbc:LineExtensionAmount>
  <cbc:TaxAmount>18.00</cbc:TaxAmount>
  <cbc:PayableAmount>118.00</cbc:PayableAmount>
</Invoice>`;

		const file = new File([xml], "FAC-001.xml", { type: "text/xml" });
		const result = await orchestrator.processBatch(
			{ companyId: "cmp-1", batchId: "batch-test-001" },
			[file],
		);

		expect(result.ready).toBe(1);
		expect(result.errors).toBe(0);
		expect(events.some((event) => event.type === "batch:complete")).toBe(true);
		expect(events.some((event) => event.type === "invoice:ready")).toBe(true);
		expect(
			events.filter((event) => event.type === "agent:status").length,
		).toBeGreaterThan(0);
	});

	it("marks invoice needs-review when RUC check digit fails", async () => {
		const events: InboxSseEvent[] = [];
		const orchestrator = new InvoiceOrchestrator((event) => events.push(event));

		const xml = `<?xml version="1.0"?>
<Invoice xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>20123456789</cbc:ID>
  <cbc:LineExtensionAmount>100.00</cbc:LineExtensionAmount>
  <cbc:TaxAmount>18.00</cbc:TaxAmount>
  <cbc:PayableAmount>118.00</cbc:PayableAmount>
</Invoice>`;

		const file = new File([xml], "BOL-002.xml", { type: "text/xml" });
		const result = await orchestrator.processBatch(
			{ companyId: "cmp-1", batchId: "batch-test-002" },
			[file],
		);

		expect(result.needsReview).toBe(1);
		expect(events.some((event) => event.type === "agent:debate")).toBe(true);
		expect(events.some((event) => event.type === "invoice:needs-review")).toBe(
			true,
		);
	});
});
