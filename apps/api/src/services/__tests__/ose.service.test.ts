/**
 * OSE Service Tests
 * Following Arrange-Act-Assert pattern
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { OSEService } from "../ose.service";

describe("OSEService Configuration Validation", () => {
	beforeEach(() => {
		OSEService.updateConfig({
			apiToken: "",
			ruc: "",
			username: "",
			apiUrl: "https://test.api.com",
			provider: "nubefact",
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns error when OSE_API_TOKEN is missing", async () => {
		const response = await OSEService.sendInvoice({
			xmlContent: "<Invoice />",
			invoiceNumber: "F001-1",
			invoiceType: "01",
		});

		expect(response.success).toBe(false);
		expect(response.error).toContain("OSE_API_TOKEN");
		expect(response.attemptsCount).toBe(0);
	});

	it("returns error when COMPANY_RUC is missing", async () => {
		OSEService.updateConfig({ apiToken: "valid-token" });

		const response = await OSEService.sendInvoice({
			xmlContent: "<Invoice />",
			invoiceNumber: "F001-2",
			invoiceType: "01",
		});

		expect(response.success).toBe(false);
		expect(response.error).toContain("COMPANY_RUC");
	});

	it("returns error when RUC has invalid format", async () => {
		OSEService.updateConfig({
			apiToken: "valid-token",
			ruc: "123", // Invalid: not 11 digits
		});

		const response = await OSEService.sendInvoice({
			xmlContent: "<Invoice />",
			invoiceNumber: "F001-3",
			invoiceType: "01",
		});

		expect(response.success).toBe(false);
	});
});

describe("OSEService.parseCDR", () => {
	it("parses valid CDR XML correctly", () => {
		const cdrXml = `<?xml version="1.0"?>
      <ApplicationResponse>
        <cbc:ResponseCode>0</cbc:ResponseCode>
        <cbc:Description>Aceptada</cbc:Description>
      </ApplicationResponse>`;

		const result = OSEService.parseCDR(Buffer.from(cdrXml).toString("base64"));

		expect(result.code).toBe("0");
		expect(result.status).toBe("0");
	});

	it("handles invalid CDR gracefully", () => {
		const result = OSEService.parseCDR(
			Buffer.from("invalid").toString("base64"),
		);
		expect(result.status).toBe("UNKNOWN");
	});
});

describe("OSEService Config Management", () => {
	it("updates configuration correctly", () => {
		const newConfig = {
			apiToken: "new-token",
			ruc: "12345678901",
			username: "test",
		};

		OSEService.updateConfig(newConfig);
		const current = OSEService.getConfig();

		expect(current.apiToken).toBe("new-token");
		expect(current.ruc).toBe("12345678901");
		expect(current.username).toBe("test");
	});

	it("preserves existing config when partial update", () => {
		OSEService.updateConfig({ apiUrl: "https://custom.api.com" });
		const current = OSEService.getConfig();

		expect(current.apiUrl).toBe("https://custom.api.com");
		expect(current.provider).toBe("nubefact"); // Default preserved
	});
});

describe("OSEService simulation mode", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns accepted response in simulation mode without credentials", async () => {
		OSEService.updateConfig({
			provider: "nubefact",
			simulationMode: true,
			apiToken: "",
			ruc: "",
			username: "",
		});

		const response = await OSEService.sendInvoice({
			xmlContent: "<Invoice />",
			invoiceNumber: "F001-10",
			invoiceType: "01",
		});

		expect(response.success).toBe(true);
		expect(response.cdrStatus).toBe("ACEPTADO");
		expect(response.attemptsCount).toBe(1);
	});

	it("returns deterministic rejection in simulation mode", async () => {
		OSEService.updateConfig({
			provider: "nubefact",
			simulationMode: true,
		});

		const response = await OSEService.sendInvoice({
			xmlContent: "<Invoice />",
			invoiceNumber: "F001-99",
			invoiceType: "01",
		});

		expect(response.success).toBe(false);
		expect(response.cdrStatus).toBe("RECHAZADO");
		expect(response.sunatCode).toBe("2001");
	});
});

describe("OSEService webhook signature", () => {
	afterEach(() => {
		OSEService.updateConfig({ webhookSecret: "" });
	});

	it("validates HMAC signature correctly when secret is configured", () => {
		const payload = JSON.stringify({ invoiceNumber: "F001-1" });
		const secret = "test-secret";
		const signature = createHmac("sha256", secret).update(payload).digest("hex");

		OSEService.updateConfig({ webhookSecret: secret });

		expect(OSEService.verifyWebhookSignature(payload, signature)).toBe(true);
		expect(OSEService.verifyWebhookSignature(payload, `sha256=${signature}`)).toBe(
			true,
		);
		expect(OSEService.verifyWebhookSignature(payload, "bad-signature")).toBe(false);
	});
});
