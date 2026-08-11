import { db } from "@drenyra/persistence/client";
import { eq } from "@drenyra/persistence/query";
import { sireSubmissions, transactions } from "@drenyra/persistence/schema";

/**
 * GovernanceFeature type.
 *
 * @example
 * ```ts
 * const value: GovernanceFeature = {} as GovernanceFeature;
 * console.log(value);
 * ```
 */
export type GovernanceFeature = "all" | "sire" | "electronic-invoicing";
/**
 * GovernanceDecision type.
 *
 * @example
 * ```ts
 * const value: GovernanceDecision = {} as GovernanceDecision;
 * console.log(value);
 * ```
 */
export type GovernanceDecision = "ALLOW" | "BLOCK";

/**
 * GovernanceAuditQuery interface.
 *
 * @example
 * ```ts
 * const value: GovernanceAuditQuery = {} as GovernanceAuditQuery;
 * console.log(value);
 * ```
 */
export interface GovernanceAuditQuery {
	companyId: string;
	feature?: GovernanceFeature;
	decision?: GovernanceDecision;
	limit?: number;
	offset?: number;
}

/**
 * GovernanceAuditRecord interface.
 *
 * @example
 * ```ts
 * const value: GovernanceAuditRecord = {} as GovernanceAuditRecord;
 * console.log(value);
 * ```
 */
export interface GovernanceAuditRecord {
	feature: "sire" | "electronic-invoicing";
	entityType: "sire_submission" | "transaction";
	entityId: string;
	decision: GovernanceDecision;
	action: string;
	reason: string;
	objective?: string;
	hash?: string;
	decisionId?: string;
	timestamp: string;
	source: "sire_submissions" | "transactions.tags.electronicInvoicingTrail";
}

/**
 * GovernanceAuditResult interface.
 *
 * @example
 * ```ts
 * const value: GovernanceAuditResult = {} as GovernanceAuditResult;
 * console.log(value);
 * ```
 */
export interface GovernanceAuditResult {
	items: GovernanceAuditRecord[];
	total: number;
	limit: number;
	offset: number;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const EXTRA_SCAN_BUFFER = 100;
const MAX_SCAN_LIMIT = 500;

/**
 * GovernanceAuditService class.
 *
 * @example
 * ```ts
 * const value = new GovernanceAuditService();
 * console.log(value);
 * ```
 */
export class GovernanceAuditService {
	static async listDecisions(
		query: GovernanceAuditQuery,
	): Promise<GovernanceAuditResult> {
		const limit = clampLimit(query.limit);
		const offset = clampOffset(query.offset);
		const scanLimit = Math.min(
			limit + offset + EXTRA_SCAN_BUFFER,
			MAX_SCAN_LIMIT,
		);

		const items: GovernanceAuditRecord[] = [];

		if (!query.feature || query.feature === "all" || query.feature === "sire") {
			const sireRows = await db.query.sireSubmissions.findMany({
				where: eq(sireSubmissions.companyId, query.companyId),
				columns: {
					id: true,
					status: true,
					warnings: true,
					errors: true,
					sunatMessage: true,
					createdAt: true,
					updatedAt: true,
					processedAt: true,
				},
				orderBy: (table, { desc }) => desc(table.createdAt),
				limit: scanLimit,
			});

			for (const row of sireRows) {
				const trace = extractSireTrace(row.warnings, row.errors);
				const decision =
					normalizeDecision(readString(trace?.decision)) ??
					(row.status === "BLOCKED_POLICY" ? "BLOCK" : null);
				if (!decision) continue;

				const timestamp = resolveTimestamp([
					readString(trace?.timestamp),
					row.processedAt,
					row.updatedAt,
					row.createdAt,
				]);

				items.push({
					feature: "sire",
					entityType: "sire_submission",
					entityId: row.id,
					decision,
					action: readString(trace?.action) ?? "sire_submit",
					reason:
						readString(trace?.reason) ??
						row.sunatMessage ??
						"Governance decision registered for SIRE submission",
					...(readString(trace?.objective) !== undefined
						? { objective: readString(trace?.objective) }
						: {}),
					...(readString(trace?.hash) !== undefined
						? { hash: readString(trace?.hash) }
						: {}),
					...(readString(trace?.decisionId) !== undefined
						? { decisionId: readString(trace?.decisionId) }
						: {}),
					timestamp,
					source: "sire_submissions",
				});
			}
		}

		if (
			!query.feature ||
			query.feature === "all" ||
			query.feature === "electronic-invoicing"
		) {
			const txRows = await db.query.transactions.findMany({
				where: eq(transactions.companyId, query.companyId),
				columns: {
					id: true,
					tags: true,
					createdAt: true,
					updatedAt: true,
				},
				orderBy: (table, { desc }) => desc(table.updatedAt),
				limit: scanLimit,
			});

			for (const row of txRows) {
				const tags = asObject(row.tags);
				const trail = tags?.electronicInvoicingTrail;
				if (!Array.isArray(trail)) continue;

				for (const eventRaw of trail) {
					const event = asObject(eventRaw);
					if (!event) continue;
					if (readString(event.stage) !== "AUTONOMY_POLICY") continue;

					const metadata = asObject(event.metadata);
					const trace = asObject(metadata?.governance);
					const decision =
						normalizeDecision(readString(trace?.decision)) ??
						normalizeDecision(readString(event.status));
					if (!decision) continue;

					const timestamp = resolveTimestamp([
						readString(trace?.timestamp),
						readString(event.at),
						row.updatedAt,
						row.createdAt,
					]);

					items.push({
						feature: "electronic-invoicing",
						entityType: "transaction",
						entityId: row.id,
						decision,
						action: readString(trace?.action) ?? "electronic_invoice_send",
						reason:
							readString(trace?.reason) ??
							readString(event.message) ??
							"Governance decision registered for electronic invoicing",
						...(readString(trace?.objective) !== undefined
							? { objective: readString(trace?.objective) }
							: {}),
						...(readString(trace?.hash) !== undefined
							? { hash: readString(trace?.hash) }
							: {}),
						...(readString(trace?.decisionId) !== undefined
							? { decisionId: readString(trace?.decisionId) }
							: {}),
						timestamp,
						source: "transactions.tags.electronicInvoicingTrail",
					});
				}
			}
		}

		const filtered = query.decision
			? items.filter((item) => item.decision === query.decision)
			: items;

		filtered.sort((a, b) => toEpoch(b.timestamp) - toEpoch(a.timestamp));

		return {
			items: filtered.slice(offset, offset + limit),
			total: filtered.length,
			limit,
			offset,
		};
	}
}

function clampLimit(value?: number): number {
	if (!Number.isFinite(value) || !value || value <= 0) return DEFAULT_LIMIT;
	return Math.min(Math.trunc(value), MAX_LIMIT);
}

function clampOffset(value?: number): number {
	if (!Number.isFinite(value) || value === undefined || value < 0) return 0;
	return Math.trunc(value);
}

function toEpoch(value: string): number {
	const parsed = Date.parse(value);
	if (Number.isNaN(parsed)) return 0;
	return parsed;
}

function resolveTimestamp(
	candidates: Array<string | Date | undefined | null>,
): string {
	for (const value of candidates) {
		if (!value) continue;
		if (value instanceof Date) return value.toISOString();
		if (typeof value === "string" && value.trim().length > 0) return value;
	}
	return new Date(0).toISOString();
}

function extractSireTrace(
	warnings: unknown,
	errors: unknown,
): Record<string, unknown> | null {
	const fromWarnings = asObject(asObject(warnings)?.governance);
	if (fromWarnings) return fromWarnings;
	const fromErrors = asObject(asObject(errors)?.governance);
	if (fromErrors) return fromErrors;
	return null;
}

function asObject(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
	if (typeof value === "string" && value.trim().length > 0) {
		return value.trim();
	}
	return null;
}

function normalizeDecision(value: string | null): GovernanceDecision | null {
	if (!value) return null;
	const normalized = value.trim().toUpperCase();
	if (normalized === "ALLOW") return "ALLOW";
	if (normalized === "BLOCK") return "BLOCK";
	return null;
}
