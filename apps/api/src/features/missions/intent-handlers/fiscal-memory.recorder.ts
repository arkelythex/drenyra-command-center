/**
 * FiscalMemoryRecorder — records APPROVED monthly-close proposals as
 * institutional fiscal memory in the drenyra-engram sidecar.
 *
 * The decision point is the human/dual approval of a monthly-close proposal:
 * that is where a fiscal decision materializes with its evidence. When
 * approved, this recorder persists a `monthly_closing` fiscal memory
 * (company RUC + fiscal period scope, source evidence as evidenceRefs,
 * risk level as severity) via the @drenyra/memory EngramFiscalMemoryRepository
 * (the SDD openspec/changes/engram-fiscal-memory-wiring, Option B).
 *
 * Best-effort by contract: recording memory must never break the mission
 * flow — failures are logged as warnings and swallowed here.
 *
 * Fail closed: the factory returns a Noop recorder unless
 * DRENYRA_ENGRAM_ENABLED — nothing touches the sidecar otherwise.
 *
 * Non-authorizing: records what was DECIDED after human approval; it never
 * approves, posts, or closes anything. The approval already happened in the
 * mission gate; this is the institutional memory of it.
 *
 * No monetary fields: Drenyra money values are BigInt cents; the proposal's
 * totals are carried as summary text, never computed.
 */

import type { ClosingProposal } from "@drenyra/application/use-cases/monthly-close";
import { FiscalMemory } from "@drenyra/domain/fiscal-memory";
import {
	EngramClient,
	EngramFiscalMemoryRepository,
	engramConfig,
	isEngramEnabled,
} from "@drenyra/memory";
import {
	resolveCompanyRuc,
	tryResolveOrganizationIdFromCompany,
} from "@drenyra/persistence/repositories/support/organization-resolver";

/** Input to record an approved monthly-close proposal as fiscal memory. */
export interface ApprovedProposalInput {
	missionId: string;
	companyId: string;
	/** The approved closing proposal (loaded from the mission). */
	proposal: ClosingProposal;
	/** Actor who approved (the human); "system" for automated paths. */
	approvedBy: string;
}

/** FiscalMemoryRecorder — the injectable write hook for fiscal decisions. */
export interface FiscalMemoryRecorder {
	recordApprovedProposal(input: ApprovedProposalInput): Promise<void>;
}

/** Noop recorder — used when the engram adapter is disabled (fail closed). */
export class NoopFiscalMemoryRecorder implements FiscalMemoryRecorder {
	async recordApprovedProposal(): Promise<void> {
		// Intentionally empty: engram is disabled.
	}
}

/** Engram-backed recorder. */
export class EngramFiscalMemoryRecorder implements FiscalMemoryRecorder {
	private readonly repository: EngramFiscalMemoryRepository;

	constructor(repository: EngramFiscalMemoryRepository) {
		this.repository = repository;
	}

	async recordApprovedProposal(input: ApprovedProposalInput): Promise<void> {
		const ruc = await resolveCompanyRuc(input.companyId);
		const organizationId = await tryResolveOrganizationIdFromCompany(
			input.companyId,
		);

		const memory = FiscalMemory.create({
			id: `mc-${input.proposal.id}`,
			tenantId: organizationId === null ? "api" : String(organizationId),
			companyId: ruc,
			ruc,
			period: input.proposal.fiscalPeriod,
			category: "monthly_closing",
			severity: severityFromRisk(input.proposal.riskLevel),
			title: `Monthly close ${input.proposal.fiscalPeriod}`,
			summary:
				`Approved proposal ${input.proposal.id}: ` +
				`${input.proposal.entryCount} entries, ` +
				`risk ${input.proposal.riskLevel.toLowerCase()}, ` +
				`evidence hash ${input.proposal.evidenceHash.slice(0, 12)}`,
			evidenceRefs: input.proposal.sourceEvidence.map(
				(evidence) => evidence.id,
			),
			tags: ["monthly-close", input.proposal.riskLevel.toLowerCase()],
			createdBy: input.approvedBy || "system",
			sourceAgentId: input.missionId,
		});

		await this.repository.save(memory);
	}
}

function severityFromRisk(
	risk: ClosingProposal["riskLevel"],
): "info" | "low" | "medium" | "high" | "critical" {
	switch (risk) {
		case "HIGH":
			return "high";
		case "MEDIUM":
			return "medium";
		case "LOW":
			return "low";
	}
}

let cachedClient: EngramClient | null = null;

/**
 * Factory: Engram recorder when the adapter is enabled, Noop otherwise
 * (fail closed).
 */
export function createFiscalMemoryRecorder(): FiscalMemoryRecorder {
	if (!isEngramEnabled()) {
		return new NoopFiscalMemoryRecorder();
	}
	if (cachedClient === null) {
		cachedClient = new EngramClient(engramConfig());
	}
	return new EngramFiscalMemoryRecorder(
		new EngramFiscalMemoryRepository(cachedClient),
	);
}
