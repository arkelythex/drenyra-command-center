import { describe, expect, it } from "vitest";
import {
	createFiscalOntologyScope,
	FISCAL_OBJECT_KIND,
	type FiscalObjectIdentity,
} from "../../_domain-types/fiscal-ontology";
import {
	DETERMINISTIC_REASON_CODE,
	GOVERNANCE_REVIEW_STATUS,
	POLICY_OUTCOME,
} from "../../_domain-types/constants";
import type {
	DeterministicValidatorResultRecord,
	PolicyDecisionRecord,
} from "../../_domain-types/fiscal-truth";
import { Money } from "../../_domain-types/money";
import {
	canTransitionFalState,
	createFiscalAgenticLedgerEvent,
	FAL_ACTOR_KIND,
	FAL_EVENT_KIND,
	FAL_EVENT_STATE,
	FAL_RISK_LEVEL,
	type FiscalAgenticLedgerEvent,
} from "../types";

const scope = createFiscalOntologyScope({
	organizationId: "org_123",
	companyId: "company_123",
	companyRuc: "20123456786",
	period: "2026-05",
	countryCode: "PE",
});

const evidenceRef: FiscalObjectIdentity = {
	id: "evidence_123",
	kind: FISCAL_OBJECT_KIND.EVIDENCE_NODE,
	scope,
};

const ledgerEntryRef: FiscalObjectIdentity = {
	id: "ledger_123",
	kind: FISCAL_OBJECT_KIND.LEDGER_ENTRY,
	scope,
};

const deterministicCheck: DeterministicValidatorResultRecord = {
	validatorName: "ruc-igv-validator",
	validatorVersion: "2026.05.1",
	inputHash: "hash_input",
	isValid: true,
	code: DETERMINISTIC_REASON_CODE.VALIDATION_OK,
	reason: "ok",
	severity: "info",
	observedAt: "2026-05-26T00:00:00.000Z",
	payload: {},
};

const policyDecision: PolicyDecisionRecord = {
	decisionId: "policy_123",
	policyVersion: "fal-policy-2026.05.1",
	governance: {
		governanceBundleId: "bundle_123",
		policyVersion: "fal-policy-2026.05.1",
		specVersion: "phase-2",
		architectureDocVersion: "1.0",
		glossaryVersion: "1.0",
		adrIds: ["ADR-025"],
		reviewStatus: GOVERNANCE_REVIEW_STATUS.APPROVED,
		approvedAt: "2026-05-26T00:00:00.000Z",
	},
	outcome: POLICY_OUTCOME.APPROVAL_REQUIRED,
	rationale: "Material ledger impact requires approval.",
	decidedAt: "2026-05-26T00:00:00.000Z",
};

function buildEvent(
	overrides: Partial<FiscalAgenticLedgerEvent> = {},
): FiscalAgenticLedgerEvent {
	return {
		eventId: "fal_event_123",
		kind: FAL_EVENT_KIND.LEDGER_ENTRY_PROPOSAL,
		state: FAL_EVENT_STATE.DRAFT_BY_AGENT,
		scope,
		proposedBy: { kind: FAL_ACTOR_KIND.AGENT, id: "evidra" },
		riskLevel: FAL_RISK_LEVEL.HIGH,
		requiresHumanApproval: true,
		sourceEvidenceRefs: [evidenceRef],
		deterministicChecks: [],
		policyDecision: null,
		approvalSnapshot: null,
		ledgerImpact: null,
		replayMetadata: null,
		auditTraceId: "trace_123",
		createdAt: "2026-05-26T00:00:00.000Z",
		payload: {},
		...overrides,
	};
}

describe("Fiscal Agentic Ledger event envelope", () => {
	it("allows draft proposal events with scoped evidence", () => {
		const event = createFiscalAgenticLedgerEvent(buildEvent());

		expect(event.state).toBe(FAL_EVENT_STATE.DRAFT_BY_AGENT);
		expect(event.sourceEvidenceRefs[0]?.scope.companyRuc.toString()).toBe(
			"20123456786",
		);
	});

	it("blocks direct draft-to-posted state transition", () => {
		expect(
			canTransitionFalState(
				FAL_EVENT_STATE.DRAFT_BY_AGENT,
				FAL_EVENT_STATE.POSTED_TO_FISCAL_LEDGER,
			),
		).toBe(false);
	});

	it("allows governed approval path to posting", () => {
		expect(
			canTransitionFalState(
				FAL_EVENT_STATE.DRAFT_BY_AGENT,
				FAL_EVENT_STATE.VALIDATED_BY_RULES,
			),
		).toBe(true);
		expect(
			canTransitionFalState(
				FAL_EVENT_STATE.NEEDS_HUMAN_REVIEW,
				FAL_EVENT_STATE.APPROVED_BY_HUMAN,
			),
		).toBe(true);
		expect(
			canTransitionFalState(
				FAL_EVENT_STATE.APPROVED_BY_HUMAN,
				FAL_EVENT_STATE.POSTED_TO_FISCAL_LEDGER,
			),
		).toBe(true);
	});

	it("rejects event envelopes without evidence", () => {
		expect(() =>
			createFiscalAgenticLedgerEvent(buildEvent({ sourceEvidenceRefs: [] })),
		).toThrow("FAL event requires source evidence");
	});

	it("rejects posted events without deterministic checks", () => {
		expect(() =>
			createFiscalAgenticLedgerEvent(
				buildEvent({ state: FAL_EVENT_STATE.POSTED_TO_FISCAL_LEDGER }),
			),
		).toThrow("Posted FAL event requires deterministic checks");
	});

	it("rejects posted events without policy decision", () => {
		expect(() =>
			createFiscalAgenticLedgerEvent(
				buildEvent({
					state: FAL_EVENT_STATE.POSTED_TO_FISCAL_LEDGER,
					deterministicChecks: [deterministicCheck],
				}),
			),
		).toThrow("Posted FAL event requires policy decision");
	});

	it("rejects material posted events without approval snapshot", () => {
		expect(() =>
			createFiscalAgenticLedgerEvent(
				buildEvent({
					state: FAL_EVENT_STATE.POSTED_TO_FISCAL_LEDGER,
					deterministicChecks: [deterministicCheck],
					policyDecision,
					replayMetadata: {
						validatorSetVersion: "validators-2026.05.1",
						policyVersion: "fal-policy-2026.05.1",
						modelProvider: "openai",
						modelName: "gpt-5.4",
						toolCallIds: ["tool_123"],
					},
					ledgerImpact: {
						ledgerEntry: ledgerEntryRef,
						amount: Money.fromCents(11800, "PEN"),
						description: "Approved invoice posting.",
					},
				}),
			),
		).toThrow("Posted FAL event requires human approval snapshot");
	});
});
