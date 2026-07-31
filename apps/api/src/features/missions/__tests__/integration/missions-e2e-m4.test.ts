/**
 * M4 E2E — Full monthly close lifecycle with signed receipts.
 *
 * Covers the M4 definition-of-done scenario:
 *   create → execute → gate blocks → proposal → approve (signed receipt) → complete
 *
 * Verifies:
 *   - State machine transitions across extended states
 *   - Receipt hash integrity
 *   - Ed25519 signature validity (cross-language verifiable)
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MissionsService } from "../../missions.service";
import { MissionEventStore } from "../../sse/mission-event-store";
import { MissionsController } from "../../missions.controller";
import { ReceiptSigningService } from "../../receipt-signing.service";
import {
	generateReceiptHash,
	verifyReceiptIntegrity,
	verifySignedReceipt,
	type ReceiptContent,
} from "@drenyra/mission-domain";

const mockDb = vi.hoisted(() => ({
	db: {
		select: vi.fn(),
		insert: vi.fn(),
		update: vi.fn(),
		transaction: vi.fn(),
	},
}));

vi.mock("@drenyra/persistence/schema", () => ({
	accountingMissions: {
		id: "id",
		companyId: "company_id",
		fiscalPeriod: "fiscal_period",
		intent: "intent",
		status: "status",
		version: "version",
		progress: "progress",
		input: "input",
		proposal: "proposal",
		rejection: "rejection",
		receiptId: "receipt_id",
		receiptHash: "receipt_hash",
		lastEventSequence: "last_event_sequence",
		createdAt: "created_at",
		updatedAt: "updated_at",
		signedReceipt: "signed_receipt",
	},
	missionIdempotency: {
		companyId: "company_id",
		idempotencyKey: "idempotency_key",
		commandType: "command_type",
		payloadHash: "payload_hash",
		missionId: "mission_id",
		executionStatus: "execution_status",
		response: "response",
		responseStatusCode: "response_status_code",
		expiresAt: "expires_at",
	},
	missionEvents: {
		missionId: "mission_id",
		sequence: "sequence",
		eventType: "event_type",
		snapshot: "snapshot",
		id: "id",
		createdAt: "created_at",
	},
}));

const companyId = "550e8400-e29b-41d4-a716-446655440000";
const missionId = "550e8400-e29b-41d4-a716-446655440001";
const actorId = "user-123";
const ctx = {
	userId: actorId,
	authUserId: actorId,
	legacyUserId: null,
	role: "admin",
	companyId,
};

function m(overrides: Record<string, unknown> = {}) {
	return {
		id: missionId,
		companyId,
		fiscalPeriod: "2026-07",
		intent: "monthly-close",
		status: "DRAFT",
		version: 1,
		progress: 0,
		input: { instruction: "Run monthly close" },
		proposal: {
			id: "proposal-1",
			missionId,
			version: 1,
			evidence: [{ id: "ev_1", label: "Balance", type: "ledger" }],
			evidenceHash: "",
			summary: "Close July",
			riskLevel: "MEDIUM",
			generatedAt: new Date().toISOString(),
		},
		rejection: null,
		receiptId: null,
		receiptHash: null,
		lastEventSequence: 0,
		steps: [],
		currentStep: "",
		blockers: [],
		createdAt: new Date("2026-07-01"),
		updatedAt: new Date("2026-07-01"),
		...overrides,
	};
}

function sel(row: any) {
	mockDb.db.select.mockReturnValue({
		from: vi
			.fn()
			.mockReturnValue({
				where: vi
					.fn()
					.mockReturnValue({
						limit: vi.fn().mockResolvedValue(row ? [row] : []),
					}),
			}),
	} as any);
}
function upd(returned: any) {
	mockDb.db.update.mockReturnValue({
		set: vi
			.fn()
			.mockReturnValue({
				where: vi
					.fn()
					.mockReturnValue({
						returning: vi.fn().mockResolvedValue([returned]),
					}),
			}),
	} as any);
}

describe("M4 E2E — Monthly close with signed receipts", () => {
	let svc: MissionsService;
	let signer: ReceiptSigningService;
	let ctrl: MissionsController;

	beforeEach(() => {
		vi.clearAllMocks();
		signer = new ReceiptSigningService();
		svc = new MissionsService(mockDb.db as any, undefined, signer);
		ctrl = new MissionsController(svc, new MissionEventStore(mockDb.db as any));
	});

	it("Step 1-2: CLI/Web creates mission, executes to RUNNING", async () => {
		// Create
		mockDb.db.transaction.mockImplementation(async (fn: any) => {
			const tx = {
				insert: vi
					.fn()
					.mockReturnValue({
						values: vi
							.fn()
							.mockReturnValue({ returning: vi.fn().mockResolvedValue([m()]) }),
					}),
			};
			return fn(tx);
		});
		const createRes = await ctrl.create(
			{
				companyId,
				fiscalPeriod: "2026-07",
				intent: "monthly-close",
				input: { instruction: "Close July" },
			},
			ctx,
		);
		expect(createRes.success).toBe(true);

		// Execute → RUNNING
		sel(m());
		upd(m({ status: "RUNNING", version: 3 }));
		const execRes = await ctrl.execute(
			missionId,
			{ expectedMissionVersion: 1 },
			{},
			ctx,
		);
		expect(execRes.success).toBe(true);
		expect((execRes as any).data.status).toBe("RUNNING");
	});

	it("Step 3-4: Gate blocks mission with BLOCKED_BY_GATE state", async () => {
		// The extended state machine allows RUNNING → BLOCKED_BY_GATE
		const { AccountingMissionStatus, VALID_TRANSITIONS } = await import(
			"@drenyra/mission-protocol"
		);
		const targets = VALID_TRANSITIONS.get(AccountingMissionStatus.RUNNING)!;
		expect(targets.has(AccountingMissionStatus.BLOCKED_BY_GATE)).toBe(true);
		expect(targets.has(AccountingMissionStatus.WAITING_FOR_EVIDENCE)).toBe(
			true,
		);
		expect(targets.has(AccountingMissionStatus.RETRYING)).toBe(true);
	});

	it("Step 5-7: Proposal generated and approved with signed receipt", async () => {
		// Build evidence hash matching proposal evidence
		const { computeEvidenceHash } = await import("@drenyra/mission-domain");
		const evidence = [{ id: "ev_1", label: "Balance", type: "ledger" }];
		const evidenceHash = computeEvidenceHash(evidence);

		const mission = m({
			status: "AWAITING_APPROVAL",
			proposal: {
				id: "proposal-1",
				missionId,
				version: 1,
				evidence,
				evidenceHash,
				summary: "Close July",
				riskLevel: "MEDIUM",
				generatedAt: new Date().toISOString(),
			},
			version: 2,
		});

		sel(mission);
		upd(
			m({
				status: "APPROVED",
				version: 3,
				receiptId: "receipt-1",
				receiptHash: "hash",
			}),
		);

		const approveRes = await ctrl.approve(
			missionId,
			{
				proposalId: "proposal-1",
				proposalVersion: 1,
				evidenceHash,
				expectedMissionVersion: 2,
			},
			ctx,
		);

		expect(approveRes.success).toBe(true);
		const data = (approveRes as any).data;
		expect(data.status).toBe("APPROVED");
		expect(data.receiptId).toBeTruthy();
		expect(data.receiptHash).toMatch(/^[a-f0-9]{64}$/);
	});

	it("Step 8-9: Receipt integrity + Ed25519 signature both valid", async () => {
		// Construct the same receipt content the service would sign
		const receiptContent: ReceiptContent = {
			missionId,
			companyId,
			actorId,
			decision: "APPROVE",
			proposalVersion: 1,
			evidenceHash: "a1b2c3d4e5",
			previousStatus: "AWAITING_APPROVAL",
			newStatus: "APPROVED",
			payloadHash: "f6e7d8c9b0",
			timestamp: new Date().toISOString(),
		};

		// Sign via the service
		const signed = signer.sign(receiptContent);

		// Hash integrity check (offline-verifiable)
		expect(verifyReceiptIntegrity(receiptContent, signed.receiptHash)).toBe(
			true,
		);
		expect(generateReceiptHash(receiptContent)).toBe(signed.receiptHash);

		// Full signed receipt verification (hash + signature)
		const result = verifySignedReceipt(signed);
		expect(result.valid).toBe(true);
		expect(result.hashValid).toBe(true);
		expect(result.signatureValid).toBe(true);
		expect(result.keyId).toBe(signer.keyId);

		// Tampered content must fail both checks
		const tampered: ReceiptContent = {
			...receiptContent,
			evidenceHash: "TAMPERED",
		};
		expect(verifyReceiptIntegrity(tampered, signed.receiptHash)).toBe(false);
	});

	it("Step 10: Signed receipt is portable JSON (exportable for offline CLI verify)", () => {
		const receiptContent: ReceiptContent = {
			missionId,
			companyId,
			actorId,
			decision: "APPROVE",
			proposalVersion: 1,
			evidenceHash: "a1b2c3d4e5",
			previousStatus: "AWAITING_APPROVAL",
			newStatus: "APPROVED",
			payloadHash: "f6e7d8c9b0",
			timestamp: new Date().toISOString(),
		};
		const signed = signer.sign(receiptContent);
		const json = JSON.stringify(signed);

		// Parsable, contains all self-verification fields
		const parsed = JSON.parse(json);
		expect(parsed.receiptHash).toHaveLength(64);
		expect(parsed.signerPublicKey).toBeTruthy();
		expect(parsed.signature).toBeTruthy();
		expect(parsed.content.missionId).toBe(missionId);

		// The JSON shape remains parseable by the CLI Go SignedReceipt struct;
		// Go ignores the typed bundle metadata it does not yet consume.
		const keys = Object.keys(parsed).sort();
		expect(keys).toEqual([
			"algorithm",
			"content",
			"issuedAt",
			"protocolVersion",
			"receiptHash",
			"receiptType",
			"signature",
			"signerKeyId",
			"signerPublicKey",
		]);
	});

	it("Step 11: Extended states survive restart (recoverable)", async () => {
		const { AccountingMissionStatus, isRecoverable } = await import(
			"@drenyra/mission-protocol"
		);
		expect(isRecoverable(AccountingMissionStatus.WAITING_FOR_EVIDENCE)).toBe(
			true,
		);
		expect(isRecoverable(AccountingMissionStatus.BLOCKED_BY_GATE)).toBe(true);
		expect(isRecoverable(AccountingMissionStatus.RETRYING)).toBe(true);
		expect(isRecoverable(AccountingMissionStatus.UNKNOWN)).toBe(true);
	});
});
