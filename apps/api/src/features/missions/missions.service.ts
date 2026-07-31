import { and, eq } from "drizzle-orm";
import { accountingMissions } from "@drenyra/persistence/schema";
import {
	AccountingMissionStatus,
	MissionError,
	MissionErrorCode,
	validateTransition,
	guardTerminal,
	reconcileTransition,
	generateReceiptHash,
	type ReceiptContent,
} from "@drenyra/mission-domain";
import { optimisticUpdate } from "./middleware/concurrency.middleware";
import type {
	RunIntentCommand,
	ApproveCommand,
	RejectCommand,
	ReconcileCommand,
	MissionSnapshot,
} from "@drenyra/mission-domain";
import { getIntentHandler } from "./intent-handlers/intent-handlers.registry";
import type { MissionIntentHandler } from "./intent-handlers/mission-intent-handler.interface";
import { ReceiptSigningService } from "./receipt-signing.service";

const VALID_INTENTS = new Set([
	"monthly-close",
	"correction",
	"reconciliation",
	"invoice-review",
	"compliance-check",
]);
const VALID_RECONCILE_TARGETS = new Set(["RUNNING", "FAILED", "COMPLETED"]);

function toSnapshot(row: Record<string, unknown>): MissionSnapshot {
	return {
		id: row.id as string,
		companyId: row.companyId as string,
		fiscalPeriod: row.fiscalPeriod as string,
		intent: row.intent as MissionSnapshot["intent"],
		status: row.status as AccountingMissionStatus,
		version: row.version as number,
		progress: row.progress as number,
		steps: (row.steps as MissionSnapshot["steps"]) ?? [],
		currentStep: (row.currentStep as string) ?? "",
		blockers: (row.blockers as MissionSnapshot["blockers"]) ?? [],
		proposal: row.proposal as MissionSnapshot["proposal"],
		rejection: row.rejection as MissionSnapshot["rejection"],
		receiptId: row.receiptId as string | null,
		receiptHash: row.receiptHash as string | null,
		lastEventSequence: row.lastEventSequence as number,
		createdAt:
			row.createdAt instanceof Date
				? (row.createdAt as Date).toISOString()
				: String(row.createdAt ?? ""),
		updatedAt:
			row.updatedAt instanceof Date
				? (row.updatedAt as Date).toISOString()
				: String(row.updatedAt ?? ""),
	};
}

export class MissionsService {
	constructor(
		private readonly db: any,
		private readonly intentHandlers?: Map<string, MissionIntentHandler>,
		private readonly receiptSigner?: ReceiptSigningService,
	) {
		if (!this.receiptSigner) {
			try {
				this.receiptSigner = new ReceiptSigningService();
			} catch {
				// Signing is best-effort; hash-only receipts still work
			}
		}
	}

	async createMission(
		companyId: string,
		cmd: RunIntentCommand,
	): Promise<MissionSnapshot> {
		if (!VALID_INTENTS.has(cmd.intent)) {
			throw new MissionError(
				MissionErrorCode.INVALID_TRANSITION,
				400,
				`Invalid intent: ${cmd.intent}`,
			);
		}

		const rows = await this.db.transaction(async (tx: any) => {
			const inserted = await tx
				.insert(accountingMissions)
				.values({
					companyId,
					fiscalPeriod: cmd.fiscalPeriod,
					intent: cmd.intent,
					status: "DRAFT",
					version: 1,
					progress: 0,
					input: cmd.input,
					lastEventSequence: 0,
				})
				.returning();
			return inserted;
		});

		return toSnapshot(rows[0]);
	}

	async getMission(
		missionId: string,
		companyId: string,
	): Promise<MissionSnapshot | null> {
		const rows = await this.db
			.select()
			.from(accountingMissions)
			.where(
				and(
					eq(accountingMissions.id, missionId),
					eq(accountingMissions.companyId, companyId),
				),
			)
			.limit(1);

		if (rows.length === 0) return null;
		return toSnapshot(rows[0]);
	}

	async executeMission(
		missionId: string,
		companyId: string,
		opts: { expectedMissionVersion: number },
	): Promise<MissionSnapshot> {
		const mission = await this.getMissionOrThrow(missionId, companyId);

		guardTerminal(mission.status as AccountingMissionStatus);
		validateTransition(
			mission.status as AccountingMissionStatus,
			AccountingMissionStatus.QUEUED,
		);

		const newVersion = await optimisticUpdate(
			this.db,
			missionId,
			companyId,
			opts.expectedMissionVersion,
			{
				status: AccountingMissionStatus.QUEUED,
			},
		);

		// Transition QUEUED → RUNNING and invoke intent handler
		validateTransition(
			AccountingMissionStatus.QUEUED,
			AccountingMissionStatus.RUNNING,
		);
		const runningVersion = await optimisticUpdate(
			this.db,
			missionId,
			companyId,
			newVersion,
			{
				status: AccountingMissionStatus.RUNNING,
			},
		);

		// Dispatch to intent-specific handler (fire-and-forget)
		const handler = getIntentHandler(mission.intent);
		if (handler) {
			handler.onRunning(missionId, companyId).catch((err) => {
				console.error(
					"[MissionsService] Intent handler crash for",
					mission.intent,
					err,
				);
			});
		}

		return {
			...mission,
			status: AccountingMissionStatus.RUNNING,
			version: runningVersion,
		};
	}

	async approveMission(
		missionId: string,
		companyId: string,
		actorId: string,
		cmd: ApproveCommand,
	): Promise<MissionSnapshot> {
		const mission = await this.getMissionOrThrow(missionId, companyId);

		if (mission.status !== AccountingMissionStatus.AWAITING_APPROVAL) {
			throw new MissionError(
				MissionErrorCode.INVALID_TRANSITION,
				409,
				`Cannot approve from ${mission.status}`,
			);
		}

		validateTransition(
			mission.status as AccountingMissionStatus,
			AccountingMissionStatus.APPROVED,
		);

		const proposal = mission.proposal as any;
		if (!proposal) {
			throw new MissionError(
				MissionErrorCode.INVALID_TRANSITION,
				400,
				"No proposal to approve",
			);
		}

		if (proposal.version !== cmd.proposalVersion) {
			throw new MissionError(
				MissionErrorCode.EVIDENCE_MISMATCH,
				409,
				`Proposal version mismatch: expected ${cmd.proposalVersion}, current ${proposal.version}`,
			);
		}

		const { computeEvidenceHash } = await import("@drenyra/mission-domain");
		const currentEvidenceHash = computeEvidenceHash(proposal.evidence ?? []);
		if (currentEvidenceHash !== cmd.evidenceHash) {
			throw new MissionError(
				MissionErrorCode.EVIDENCE_MISMATCH,
				409,
				"Evidence changed. Re-review before approving.",
				{ currentHash: currentEvidenceHash, expectedHash: cmd.evidenceHash },
			);
		}

		const payloadHashData = {
			proposalId: cmd.proposalId,
			proposalVersion: cmd.proposalVersion,
			evidenceHash: cmd.evidenceHash,
		};
		const { createHash } = await import("node:crypto");
		const payloadHash = createHash("sha256")
			.update(
				JSON.stringify(payloadHashData, Object.keys(payloadHashData).sort()),
			)
			.digest("hex");

		const receiptContent: ReceiptContent = {
			missionId,
			companyId,
			actorId,
			decision: "APPROVE",
			proposalVersion: cmd.proposalVersion,
			evidenceHash: cmd.evidenceHash,
			previousStatus: mission.status,
			newStatus: AccountingMissionStatus.APPROVED,
			payloadHash,
			timestamp: new Date().toISOString(),
		};

		const receiptHash = generateReceiptHash(receiptContent);

		// Sign the receipt with Ed25519 for offline authenticity verification
		let signedReceiptJson: string | null = null;
		if (this.receiptSigner) {
			try {
				const signed = this.receiptSigner.sign(receiptContent);
				signedReceiptJson = JSON.stringify(signed);
			} catch (err) {
				console.warn("[MissionsService] Receipt signing failed:", err);
			}
		}

		// Generate a deterministic receipt ID from the hash
		const receiptId = receiptHash
			.substring(0, 36)
			.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");

		const newVersion = await optimisticUpdate(
			this.db,
			missionId,
			companyId,
			cmd.expectedMissionVersion,
			{
				status: AccountingMissionStatus.APPROVED,
				receiptId,
				receiptHash,
				signedReceipt: signedReceiptJson,
			},
		);

		// Dispatch onApproved to intent handler (e.g., apply entries)
		const handler = getIntentHandler(mission.intent);
		if (handler) {
			handler.onApproved(missionId, companyId).catch((err) => {
				console.error(
					"[MissionsService] onApproved handler crash for",
					mission.intent,
					err,
				);
			});
		}

		return {
			...mission,
			status: AccountingMissionStatus.APPROVED,
			version: newVersion,
			receiptId,
			receiptHash,
		};
	}

	async rejectMission(
		missionId: string,
		companyId: string,
		actorId: string,
		cmd: RejectCommand,
	): Promise<MissionSnapshot> {
		if (!cmd.reason || cmd.reason.trim().length === 0) {
			throw new MissionError(
				MissionErrorCode.INVALID_TRANSITION,
				400,
				"Reason is required for rejection",
			);
		}

		const mission = await this.getMissionOrThrow(missionId, companyId);

		if (mission.status !== AccountingMissionStatus.AWAITING_APPROVAL) {
			throw new MissionError(
				MissionErrorCode.INVALID_TRANSITION,
				409,
				`Cannot reject from ${mission.status}`,
			);
		}

		validateTransition(
			mission.status as AccountingMissionStatus,
			AccountingMissionStatus.REJECTED,
		);

		const rejection = {
			reason: cmd.reason,
			rejectedBy: actorId,
			rejectedAt: new Date().toISOString(),
			proposalVersion: cmd.proposalVersion,
		};

		const newVersion = await optimisticUpdate(
			this.db,
			missionId,
			companyId,
			cmd.expectedMissionVersion,
			{
				status: AccountingMissionStatus.REJECTED,
				rejection,
			},
		);

		return {
			...mission,
			status: AccountingMissionStatus.REJECTED,
			version: newVersion,
			rejection,
		};
	}

	async reconcileMission(
		missionId: string,
		companyId: string,
		_actorId: string,
		cmd: ReconcileCommand,
	): Promise<MissionSnapshot> {
		if (!cmd.reason || cmd.reason.trim().length === 0) {
			throw new MissionError(
				MissionErrorCode.INVALID_TRANSITION,
				400,
				"Reason is required for reconciliation",
			);
		}

		if (!VALID_RECONCILE_TARGETS.has(cmd.resolution)) {
			throw new MissionError(
				MissionErrorCode.INVALID_TRANSITION,
				400,
				`Invalid reconciliation target: ${cmd.resolution}`,
			);
		}

		const mission = await this.getMissionOrThrow(missionId, companyId);

		const newStatus = cmd.resolution as unknown as AccountingMissionStatus;
		reconcileTransition(mission.status as AccountingMissionStatus, newStatus);

		const newVersion = await optimisticUpdate(
			this.db,
			missionId,
			companyId,
			cmd.expectedMissionVersion,
			{
				status: newStatus,
			},
		);

		return { ...mission, status: newStatus, version: newVersion };
	}

	private async getMissionOrThrow(
		missionId: string,
		companyId: string,
	): Promise<MissionSnapshot> {
		const mission = await this.getMission(missionId, companyId);
		if (!mission) {
			throw new MissionError(
				MissionErrorCode.MISSION_NOT_FOUND,
				404,
				`Mission ${missionId} not found`,
			);
		}
		return mission;
	}
}
