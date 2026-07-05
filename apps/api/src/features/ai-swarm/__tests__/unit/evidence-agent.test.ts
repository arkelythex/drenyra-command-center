import { describe, expect, it } from "vitest";
import { EvidenceAgent } from "../../agents/evidence.agent";

describe("EvidenceAgent", () => {
	it("stores evidence metadata for buffer payloads", async () => {
		const agent = new EvidenceAgent();
		const file = Buffer.from("invoice-content");

		const result = await agent.storeEvidence(file, {
			invoiceId: "INV-EVD-001",
			documentType: "invoice",
			originalFilename: "factura-f001-1.pdf",
			mimeType: "application/pdf",
		});

		expect(result.success).toBe(true);
		expect(result.data?.invoiceId).toBe("INV-EVD-001");
		expect(result.data?.sizeBytes).toBe(file.length);
		expect(result.data?.storageUrl).toContain("storage://evidence/");
		expect(result.metadata.agentType).toBe("evidence");
		expect(result.metadata.costUsd).toBe(0);
	});

	it("stores batches in parallel and preserves one result per input file", async () => {
		const agent = new EvidenceAgent();

		const result = await agent.storeBatch([
			{
				file: Buffer.from("a"),
				metadata: {
					invoiceId: "INV-EVD-101",
					documentType: "invoice",
					originalFilename: "a.pdf",
					mimeType: "application/pdf",
				},
			},
			{
				file: Buffer.from("bb"),
				metadata: {
					invoiceId: "INV-EVD-102",
					documentType: "invoice",
					originalFilename: "b.pdf",
					mimeType: "application/pdf",
				},
			},
		]);

		expect(result).toHaveLength(2);
		expect(result.every((entry) => entry.success)).toBe(true);
	});

	it("returns an empty list when no evidence exists for an invoice yet", async () => {
		const agent = new EvidenceAgent();
		const result = await agent.getEvidenceByInvoiceId("INV-EVD-NONE");

		expect(result.success).toBe(true);
		expect(result.data).toEqual([]);
	});
});
