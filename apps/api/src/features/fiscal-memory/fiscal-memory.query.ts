/**
 * FiscalMemoryQueryService — read side of the institutional fiscal-memory
 * loop (the "Consultar" step of Decidir → Registrar → Consultar).
 *
 * Wraps the @drenyra/memory EngramFiscalMemoryRepository (the adapter delivered
 * and tested in PR #139) and exposes company-scoped reads: list with optional
 * period/category/severity/evidenceRef filters, and findById. Every read is
 * scoped by tenantId + companyId + ruc — a different tenant/company/RUC can
 * never retrieve another tenant's memory (structural isolation, the engine's
 * scope-first contract).
 *
 * Fail closed: the factory returns a DisabledFiscalMemoryQueryService unless
 * DRENYRA_ENGRAM_ENABLED is explicitly on — nothing touches the sidecar
 * otherwise. A disabled or unreachable sidecar surfaces as a typed result,
 * never as an unhandled crash.
 *
 * Non-authorizing: this service only reads institutional memory; it never
 * approves, posts, or closes anything.
 *
 * No monetary fields: Drenyra money values are BigInt cents (repo-wide rule);
 * fiscal memories carry no money values.
 */

import type {
	FiscalMemory,
	FiscalMemoryCategory,
	FiscalMemoryScope,
	FiscalMemorySeverity,
} from "@drenyra/domain/fiscal-memory";
import {
	EngramClient,
	EngramFiscalMemoryRepository,
	type EngramObservation,
	engramConfig,
	isEngramEnabled,
	observationToFiscalMemory,
} from "@drenyra/memory";

/** Optional filters for listing fiscal memories of a company scope. */
export interface FiscalMemoryListFilters {
	/** Fiscal period (YYYY-MM). Exact match on the memory's period. */
	period?: string;
	/** Category (e.g. monthly_closing, tax_decision, audit_finding). */
	category?: FiscalMemoryCategory;
	/** Severity (info | low | medium | high | critical). */
	severity?: FiscalMemorySeverity;
	/** Evidence reference id — memories that carry this evidenceRef. */
	evidenceRef?: string;
}

/** Outermost scope resolution — derived from the authenticated company. */
export interface FiscalMemoryScopeResolver {
	resolve(companyId: string): Promise<FiscalMemoryScope>;
}

/** Typed disabled result — the adapter is off (fail closed). */
export interface DisabledFiscalMemoryResult {
	readonly disabled: true;
}

/** Typed read result — memories found (possibly none). */
export interface FiscalMemoryListResult {
	readonly disabled: false;
	readonly memories: FiscalMemory[];
}

/** Typed findById result — a single memory or none. */
export interface FiscalMemoryByIdResult {
	readonly disabled: false;
	readonly memory: FiscalMemory | null;
}

export interface FiscalMemoryQueryService {
	list(
		companyId: string,
		filters: FiscalMemoryListFilters,
	): Promise<DisabledFiscalMemoryResult | FiscalMemoryListResult>;
	findById(
		companyId: string,
		memoryId: string,
	): Promise<DisabledFiscalMemoryResult | FiscalMemoryByIdResult>;
}

/** Disabled implementation — used when the engram adapter is off (fail closed). */
export class DisabledFiscalMemoryQueryService
	implements FiscalMemoryQueryService
{
	async list(
		_companyId: string,
		_filters: FiscalMemoryListFilters,
	): Promise<DisabledFiscalMemoryResult> {
		return { disabled: true };
	}

	async findById(
		_companyId: string,
		_memoryId: string,
	): Promise<DisabledFiscalMemoryResult> {
		return { disabled: true };
	}
}

/**
 * Engram-backed query service.
 *
 * The adapter is scope-first: list reads the company scope chain via
 * `client.context({ ruc, organizationId })` and filters to fiscal-memory
 * observations, exactly mirroring the adapter's findByPeriod read path but
 * applying ALL provided filters (period + category + severity + evidenceRef)
 * in one deterministic pass. findById delegates to the repository (which
 * already enforces scope on the read).
 */
export class EngramFiscalMemoryQueryService
	implements FiscalMemoryQueryService
{
	private readonly repository: EngramFiscalMemoryRepository;

	constructor(
		private readonly client: EngramClient,
		private readonly scopeResolver: FiscalMemoryScopeResolver,
	) {
		this.repository = new EngramFiscalMemoryRepository(client);
	}

	async list(
		companyId: string,
		filters: FiscalMemoryListFilters,
	): Promise<FiscalMemoryListResult> {
		const scope = await this.scopeResolver.resolve(companyId);
		const observations = await this.client.context({
			ruc: scope.ruc,
			organizationId: scope.tenantId,
		});

		const memories = observations
			.filter((observation) => observation.type === "fiscal_memory")
			.map((observation) => toMemorySafe(observation))
			.filter((memory): memory is FiscalMemory => memory !== null)
			.filter((memory) => matches(memory, filters));

		return { disabled: false, memories };
	}

	async findById(
		companyId: string,
		memoryId: string,
	): Promise<FiscalMemoryByIdResult> {
		const scope = await this.scopeResolver.resolve(companyId);
		const memory = await this.repository.findById(memoryId, scope);
		return { disabled: false, memory };
	}
}

/** Convert an observation to a fiscal memory, skipping corrupt/non-fiscal rows. */
function toMemorySafe(observation: EngramObservation): FiscalMemory | null {
	try {
		return observationToFiscalMemory(observation);
	} catch {
		// Not a fiscal memory (or a corrupt row) — skip, never throw.
		return null;
	}
}

/** Apply all filters in one deterministic pass. */
function matches(
	memory: FiscalMemory,
	filters: FiscalMemoryListFilters,
): boolean {
	if (filters.period !== undefined && memory.period !== filters.period) {
		return false;
	}
	if (filters.category !== undefined && memory.category !== filters.category) {
		return false;
	}
	if (filters.severity !== undefined && memory.severity !== filters.severity) {
		return false;
	}
	if (
		filters.evidenceRef !== undefined &&
		!memory.evidenceRefs.includes(filters.evidenceRef)
	) {
		return false;
	}
	return true;
}

let cachedClient: EngramClient | null = null;

/**
 * Factory: Engram-backed query service when the adapter is enabled, a
 * Disabled service otherwise (fail closed).
 */
export function createFiscalMemoryQueryService(
	scopeResolver: FiscalMemoryScopeResolver,
): FiscalMemoryQueryService {
	if (!isEngramEnabled()) {
		return new DisabledFiscalMemoryQueryService();
	}
	if (cachedClient === null) {
		cachedClient = new EngramClient(engramConfig());
	}
	return new EngramFiscalMemoryQueryService(cachedClient, scopeResolver);
}
