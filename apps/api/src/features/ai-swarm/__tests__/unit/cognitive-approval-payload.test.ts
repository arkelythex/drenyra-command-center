import { describe, expect, it } from "vitest";
import {
	decodeApprovalPayload,
	encodeApprovalPayload,
} from "../../api/cognitive-approval-payload";

describe("cognitiveApprovalPayload", () => {
	it("stores sanitized approval previews with stable hash", () => {
		const payload = encodeApprovalPayload(
			{
				ruc: "20123456789",
				amount: 118,
			},
			null,
		);

		expect(payload).toEqual({
			schema: "approval_payload_v2",
			argsPreview: {
				ruc: "[REDACTED]",
				amount: 118,
			},
			argsHash: expect.any(String),
			pairing: null,
		});
	});

	it("decodes legacy payloads as sanitized previews", () => {
		const decoded = decodeApprovalPayload({
			schema: "approval_payload_v1",
			args: {
				email: "demo@arkelythexfounders.com",
				approved: true,
			},
			pairing: null,
		});

		expect(decoded).toEqual({
			args: {
				email: "[REDACTED]",
				approved: true,
			},
			argsHash: expect.any(String),
			pairing: null,
		});
	});
});
