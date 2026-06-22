import { beforeEach, describe, expect, it, vi } from "vitest";
import { sireSubmissions, transactions } from "@arkelythex/persistence/schema";
import { eq } from "@arkelythex/persistence/query";
import { ArtifactEventQueryService } from "../../artifact-event-query.service";
import { GovernanceAuditService } from "../../governance-audit.service";

const { authAuditLogsFindManyMock, sireFindManyMock, transactionsFindManyMock } =
	vi.hoisted(() => ({
		authAuditLogsFindManyMock: vi.fn(),
		sireFindManyMock: vi.fn(),
		transactionsFindManyMock: vi.fn(),
	}));

vi.mock("@arkelythex/persistence/client", () => ({
	db: {
		query: {
			authAuditLogs: { findMany: authAuditLogsFindManyMock },
			sireSubmissions: { findMany: sireFindManyMock },
			transactions: { findMany: transactionsFindManyMock },
		},
	},
}));

interface QueryCall {
	where?: unknown;
	limit?: number;
}

interface SireSubmissionFixture {
	id: string;
	status: string;
	warnings: unknown;
	errors: unknown;
	sunatMessage: string | null;
	createdAt: Date;
	updatedAt: Date | null;
	processedAt: Date | null;
}

interface TransactionFixture {
	id: string;
	tags: unknown;
	createdAt: Date;
	updatedAt: Date | null;
}

interface AuthAuditLogFixture {
	id: string;
	userId: string | null;
	timestamp: Date;
	details: unknown;
}

const companyId = "company-1";

function makeSireSubmission(
	overrides: Partial<SireSubmissionFixture> = {},
): SireSubmissionFixture {
	return {
		id: "sire-1",
		status: "BLOCKED_POLICY",
		warnings: null,
		errors: null,
		sunatMessage: "SUNAT policy blocked submission",
		createdAt: new Date("2026-05-16T10:00:00.000Z"),
		updatedAt: new Date("2026-05-16T10:05:00.000Z"),
		processedAt: null,
		...overrides,
	};
}

function makeTransaction(
	overrides: Partial<TransactionFixture> = {},
): TransactionFixture {
	return {
		id: "tx-1",
		tags: {
			electronicInvoicingTrail: [
				{
					stage: "AUTONOMY_POLICY",
					status: "ALLOW",
					at: "2026-05-16T11:00:00.000Z",
					message: "Allowed by policy",
					metadata: {
						governance: {
							decision: "ALLOW",
							action: "emit_invoice",
							reason: "Within deterministic policy",
							objective: "invoice-emission",
							hash: "sha256:tx",
							decisionId: "decision-tx-1",
							timestamp: "2026-05-16T11:01:00.000Z",
						},
					},
				},
				{ stage: "SIGNED_XML", status: "OK" },
			],
		},
		createdAt: new Date("2026-05-16T10:50:00.000Z"),
		updatedAt: new Date("2026-05-16T11:02:00.000Z"),
		...overrides,
	};
}

function makeArtifactRow(
	overrides: Partial<AuthAuditLogFixture> = {},
): AuthAuditLogFixture {
	return {
		id: "audit-1",
		userId: "user-1",
		timestamp: new Date("2026-05-16T12:00:00.000Z"),
		details: {
			type: "ARTIFACT_EVENT",
			source: "workspace",
			companyId,
			actionId: "approve-artifact",
			createdAt: "2026-05-16T12:01:00.000Z",
			artifactId: "artifact-1",
			artifactType: "sire-export",
			traceId: "trace-1",
			message: "Artifact approved",
			nextStatus: "approved",
			payload: { checksum: "sha256:artifact" },
		},
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	authAuditLogsFindManyMock.mockResolvedValue([]);
	sireFindManyMock.mockResolvedValue([]);
	transactionsFindManyMock.mockResolvedValue([]);
});

describe("GovernanceAuditService", () => {
	it("maps blocked SIRE submissions and scopes the DB query by company", async () => {
		sireFindManyMock.mockResolvedValueOnce([makeSireSubmission()]);

		const result = await GovernanceAuditService.listDecisions({
			companyId,
			feature: "sire",
		});

		expect(result.items).toHaveLength(1);
		expect(result.items[0]).toMatchObject({
			feature: "sire",
			entityType: "sire_submission",
			entityId: "sire-1",
			decision: "BLOCK",
			action: "sire_submit",
			reason: "SUNAT policy blocked submission",
			source: "sire_submissions",
		});
		expect(sireFindManyMock).toHaveBeenCalledWith(
			expect.objectContaining<QueryCall>({
				where: eq(sireSubmissions.companyId, companyId),
			}),
		);
		expect(transactionsFindManyMock).not.toHaveBeenCalled();
	});

	it("extracts explicit governance trace fields from SIRE warnings", async () => {
		sireFindManyMock.mockResolvedValueOnce([
			makeSireSubmission({
				status: "READY",
				warnings: {
					governance: {
						decision: "ALLOW",
						action: "submit_sire",
						reason: "Approved deterministic evidence",
						objective: "sire-export",
						hash: "sha256:sire",
						decisionId: "decision-sire-1",
						timestamp: "2026-05-16T10:06:00.000Z",
					},
				},
			}),
		]);

		const result = await GovernanceAuditService.listDecisions({
			companyId,
			feature: "sire",
		});

		expect(result.items[0]).toMatchObject({
			decision: "ALLOW",
			action: "submit_sire",
			reason: "Approved deterministic evidence",
			objective: "sire-export",
			hash: "sha256:sire",
			decisionId: "decision-sire-1",
			timestamp: "2026-05-16T10:06:00.000Z",
		});
	});

	it("maps electronic invoicing autonomy policy events and ignores other trail stages", async () => {
		transactionsFindManyMock.mockResolvedValueOnce([makeTransaction()]);

		const result = await GovernanceAuditService.listDecisions({
			companyId,
			feature: "electronic-invoicing",
		});

		expect(result.items).toHaveLength(1);
		expect(result.items[0]).toMatchObject({
			feature: "electronic-invoicing",
			entityType: "transaction",
			entityId: "tx-1",
			decision: "ALLOW",
			action: "emit_invoice",
			reason: "Within deterministic policy",
			source: "transactions.tags.electronicInvoicingTrail",
		});
		expect(transactionsFindManyMock).toHaveBeenCalledWith(
			expect.objectContaining<QueryCall>({
				where: eq(transactions.companyId, companyId),
			}),
		);
		expect(sireFindManyMock).not.toHaveBeenCalled();
	});

	it("filters by decision, paginates, and sorts newest first", async () => {
		sireFindManyMock.mockResolvedValueOnce([
			makeSireSubmission({
				id: "sire-old-block",
				status: "BLOCKED_POLICY",
				createdAt: new Date("2026-05-16T08:00:00.000Z"),
			}),
		]);
		transactionsFindManyMock.mockResolvedValueOnce([
			makeTransaction({ id: "tx-new-allow" }),
			makeTransaction({
				id: "tx-newer-block",
				tags: {
					electronicInvoicingTrail: [
						{
							stage: "AUTONOMY_POLICY",
							status: "BLOCK",
							at: "2026-05-16T12:00:00.000Z",
							message: "Blocked by policy",
						},
					],
				},
			}),
		]);

		const result = await GovernanceAuditService.listDecisions({
			companyId,
			decision: "BLOCK",
			limit: 1,
			offset: 0,
		});

		expect(result.total).toBe(2);
		expect(result.items).toHaveLength(1);
		expect(result.items[0]?.entityId).toBe("tx-newer-block");
		expect(result.limit).toBe(1);
		expect(result.offset).toBe(0);
	});
});

describe("ArtifactEventQueryService", () => {
	it("filters artifact events by embedded company scope and optional filters", async () => {
		authAuditLogsFindManyMock.mockResolvedValueOnce([
			makeArtifactRow(),
			makeArtifactRow({
				id: "audit-cross-company",
				details: {
					type: "ARTIFACT_EVENT",
					source: "workspace",
					companyId: "company-other",
					artifactId: "artifact-2",
					artifactType: "sire-export",
					traceId: "trace-1",
					message: "Cross-company artifact",
				},
			}),
			makeArtifactRow({
				id: "audit-other-trace",
				details: {
					type: "ARTIFACT_EVENT",
					source: "workspace",
					companyId,
					artifactId: "artifact-3",
					artifactType: "sire-export",
					traceId: "trace-other",
					message: "Other trace",
				},
			}),
		]);

		const result = await ArtifactEventQueryService.list({
			companyId,
			traceId: "trace-1",
			artifactType: "sire-export",
			limit: 10,
		});

		expect(result.items).toHaveLength(1);
		expect(result.items[0]).toMatchObject({
			id: "audit-1",
			companyId,
			artifactId: "artifact-1",
			traceId: "trace-1",
			actionId: "approve-artifact",
		});
	});
});
