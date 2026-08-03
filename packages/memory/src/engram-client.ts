/**
 * Typed HTTP client for the Drenyra Engram sidecar (arkelythex/drenyra-engram).
 *
 * Consumes the v1 REST surface verified against the engine:
 * - POST /v1/observations — save (upsert) an observation under topicKey + scope.
 * - GET /v1/search — full-text search scoped by ruc/period/organizationId.
 * - GET /v1/context — latest revision per (topicKey, scope) chain.
 * - GET /v1/doctor — storage health report.
 *
 * Error contract: non-2xx responses carry
 * `{"error":{"code","message"}}`; they are mapped to {@link EngramError}.
 * Network failures and timeouts are also typed (never raw). No `any`.
 *
 * No monetary fields exist in this module; Drenyra money values are BigInt
 * cents (repo-wide rule) and nothing here touches them.
 *
 * @module @drenyra/memory/engram-client
 */

import { DEFAULT_ENGRAM_TIMEOUT_MS, type EngramConfig } from "./config.js";

// ──────────────────────────────────────────────
// Domain types (mirror of the engine's Go types)
// ──────────────────────────────────────────────

/** Engram scope kinds (const object pattern — single source of truth). */
export const ENGRAM_SCOPE_KIND = {
	COMPANY: "company",
	INSTITUTIONAL: "institutional",
} as const;

export type EngramScopeKind =
	(typeof ENGRAM_SCOPE_KIND)[keyof typeof ENGRAM_SCOPE_KIND];

/**
 * Fiscal scope of an observation.
 *
 * For kind=company: RUC is exactly 11 digits; period is `YYYYMM` when
 * present, empty when absent. The engine derives companyId=ruc on the HTTP
 * surface, so clients send ruc/period/organizationId — never companyId.
 */
export interface EngramScope {
	kind: EngramScopeKind;
	organizationId?: string;
	companyId?: string;
	ruc?: string;
	period?: string;
}

/** Structured content — the canonical What/Why/Where/Learned shape. */
export interface EngramContent {
	what: string;
	why: string;
	where: string;
	learned: string;
}

/** Audit metadata captured at creation; not editable afterward. */
export interface EngramProvenance {
	actor: string;
	/** UTC ISO-8601 creation time. */
	timestamp: string;
	source: string;
	session?: string;
}

/** Vigencia window: expired observations surface as stale, never current. */
export interface EngramValidity {
	effectiveAt?: string;
	expiresAt?: string;
}

/** Observation lifecycle states (const object pattern). */
export const ENGRAM_AUTHORITY_STATUS = {
	DRAFT: "draft",
	REVIEWED: "reviewed",
	PROMOTED: "promoted",
	SUPERSEDED: "superseded",
} as const;

export type EngramAuthorityStatus =
	(typeof ENGRAM_AUTHORITY_STATUS)[keyof typeof ENGRAM_AUTHORITY_STATUS];

/** Stable observation identity: id plus the upsert topic key. */
export interface EngramIdentity {
	id: string;
	topicKey: string;
}

/** A stored observation (read shape; content/scope/provenance immutable). */
export interface EngramObservation {
	identity: EngramIdentity;
	title: string;
	type: string;
	scope: EngramScope;
	content: EngramContent;
	authorityStatus: EngramAuthorityStatus;
	validity?: EngramValidity;
	provenance: EngramProvenance;
	/** 1-based revision within the (topicKey, scope) chain; a JSON integer. */
	revision: number;
}

/** Input for saving/upserting an observation under a topic key + exact scope. */
export interface EngramSaveInput {
	topicKey: string;
	title: string;
	type: string;
	scope: EngramScope;
	content: EngramContent;
	authorityStatus?: EngramAuthorityStatus;
	validity?: EngramValidity;
	provenance: EngramProvenance;
}

/** Write outcome of a save (upsert). */
export const ENGRAM_WRITE_OUTCOME = {
	CREATED: "created",
	UPDATED: "updated",
	CONFLICT: "conflict",
	UNKNOWN: "unknown",
} as const;

export type EngramWriteOutcome =
	(typeof ENGRAM_WRITE_OUTCOME)[keyof typeof ENGRAM_WRITE_OUTCOME];

/** Response of POST /v1/observations. */
export interface EngramSaveResponse {
	observation: EngramObservation;
	outcome: EngramWriteOutcome;
}

/** One entry of GET /v1/search results. */
export interface EngramSearchResult {
	observation: EngramObservation;
	/** Query-token match count; a JSON integer. */
	score: number;
	/** True when the observation is expired at read time. */
	stale: boolean;
}

/** Report of GET /v1/doctor (storage health). */
export interface EngramDoctorReport {
	schemaVersion: number;
	storage: string;
	dbPath: string;
	observations: number;
	revisionChains: number;
	transitions: number;
	relations: number;
}

// ──────────────────────────────────────────────
// Typed errors
// ──────────────────────────────────────────────

/**
 * Discriminator for {@link EngramError} sources.
 */
export type EngramErrorKind =
	| "http"
	| "network"
	| "timeout"
	| "invalid-input"
	| "invalid-response";

/** Options for constructing an {@link EngramError}. */
export interface EngramErrorOptions {
	/** Stable machine-readable code (engine code or client-side code). */
	code: string;
	message: string;
	/** HTTP status when the error came from a non-2xx response. */
	status?: number;
	/** Underlying failure (network error, timeout, invalid body). */
	cause?: unknown;
}

/**
 * Typed failure of an engram operation.
 *
 * - `kind === "http"` — the sidecar answered with a non-2xx status; `code` is
 *   the engine's stable error code when the envelope carried one.
 * - `kind === "network"` — the sidecar is unreachable.
 * - `kind === "timeout"` — the request exceeded the configured timeout.
 * - `kind === "invalid-input"` — caller supplied an invalid scope (e.g. a
 *   company-scoped read without a ruc).
 * - `kind === "invalid-response"` — the sidecar returned an unexpected body.
 */
export class EngramError extends Error {
	readonly kind: EngramErrorKind;
	readonly code: string;
	readonly status?: number;

	constructor(kind: EngramErrorKind, options: EngramErrorOptions) {
		super(options.message);
		this.name = "EngramError";
		this.kind = kind;
		this.code = options.code;
		if (options.status !== undefined) this.status = options.status;
		if (options.cause !== undefined) this.cause = options.cause;
	}
}

// ──────────────────────────────────────────────
// Client
// ──────────────────────────────────────────────

/** Parameters for company-scoped reads (GET /v1/context). */
export interface EngramReadParams {
	/** Peruvian RUC — exactly 11 digits; required for company reads. */
	ruc: string;
	/** Fiscal period `YYYYMM`; empty/absent matches period-less observations. */
	period?: string;
	/** Organization tenant dimension (part of the scope chain). */
	organizationId?: string;
}

/** Parameters for GET /v1/search. */
export interface EngramSearchParams extends EngramReadParams {
	/** Search text (required by the engine). */
	q: string;
}

/** Parameters for GET /v1/chain (full revision history of a topic key). */
export interface EngramChainParams extends EngramReadParams {
	/** Topic key of the chain (required by the engine). */
	topicKey: string;
}

/** Options for {@link EngramClient} (a subset of {@link EngramConfig}). */
export interface EngramClientOptions {
	baseUrl: string;
	token?: string;
	timeoutMs: number;
}

/**
 * Typed HTTP client over the engram v1 REST surface.
 *
 * Uses Bun's global `fetch` with an `AbortSignal.timeout` guard. Every
 * failure surfaces as an {@link EngramError}.
 *
 * @example
 * ```ts
 * const client = new EngramClient(engramConfig());
 * const observations = await client.context({ ruc: "20123456789" });
 * ```
 */
export class EngramClient {
	private readonly baseUrl: string;
	private readonly token?: string;
	private readonly timeoutMs: number;

	constructor(options: EngramClientOptions) {
		this.baseUrl = options.baseUrl.replace(/\/+$/, "");
		this.timeoutMs = options.timeoutMs;
		if (options.token !== undefined && options.token.length > 0) {
			this.token = options.token;
		}
	}

	/** GET /v1/doctor — storage health report. */
	async health(): Promise<EngramDoctorReport> {
		return this.getJson("/v1/doctor", {}, parseDoctorReport);
	}

	/** POST /v1/observations — save (upsert) an observation. */
	async save(input: EngramSaveInput): Promise<EngramSaveResponse> {
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
		};
		this.applyAuth(headers);

		const response = await this.fetchWithTimeout(
			`${this.baseUrl}/v1/observations`,
			{
				method: "POST",
				headers,
				body: JSON.stringify(input),
			},
		);

		return this.handleResponse(response, parseSaveResponse);
	}

	/** GET /v1/search — full-text search scoped by ruc/period/organizationId. */
	async search(params: EngramSearchParams): Promise<EngramSearchResult[]> {
		return this.getJson("/v1/search", params, parseSearchResults);
	}

	/**
	 * GET /v1/context — latest revision per (topicKey, scope) chain.
	 *
	 * Company-scoped reads require a valid 11-digit ruc.
	 */
	async context(params: EngramReadParams): Promise<EngramObservation[]> {
		return this.getJson("/v1/context", params, parseObservations);
	}

	/**
	 * Full revision history of a (topicKey, exact scope) chain, ordered by
	 * revision ascending — every revision, not just the current one. Scoped
	 * like every read (ruc required for company scopes).
	 */
	async chain(params: EngramChainParams): Promise<EngramObservation[]> {
		return this.getJson("/v1/chain", params, parseObservations);
	}

	// ────────────────────────────────────────────
	// Internals
	// ────────────────────────────────────────────

	private async getJson<T>(
		path: string,
		params: EngramReadParams | Record<string, string | undefined>,
		parse: (body: unknown) => T,
	): Promise<T> {
		const headers: Record<string, string> = {};
		this.applyAuth(headers);

		const response = await this.fetchWithTimeout(this.buildUrl(path, params), {
			method: "GET",
			headers,
		});

		return this.handleResponse(response, parse);
	}

	private async fetchWithTimeout(
		url: string,
		init: RequestInit,
	): Promise<Response> {
		try {
			return await fetch(url, {
				...init,
				signal: AbortSignal.timeout(this.timeoutMs),
			});
		} catch (error) {
			throw this.mapFetchError(error);
		}
	}

	private buildUrl(
		path: string,
		params: EngramReadParams | Record<string, string | undefined>,
	): string {
		const url = new URL(`${this.baseUrl}${path}`);
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined) url.searchParams.set(key, value);
		}
		return url.toString();
	}

	private applyAuth(headers: Record<string, string>): void {
		if (this.token !== undefined) {
			headers.Authorization = `Bearer ${this.token}`;
		}
	}

	private async handleResponse<T>(
		response: Response,
		parse: (body: unknown) => T,
	): Promise<T> {
		const body: unknown = await response.json().catch(() => null);
		if (!response.ok) {
			throw this.mapHttpError(response, body);
		}
		return parse(body);
	}

	private mapHttpError(response: Response, body: unknown): EngramError {
		const detail = readErrorDetail(body);
		const code =
			detail?.code !== undefined && detail.code.length > 0
				? detail.code
				: `HTTP_${response.status}`;
		const message =
			detail?.message !== undefined && detail.message.length > 0
				? detail.message
				: `engram request failed with status ${response.status}`;
		return new EngramError("http", {
			code,
			message,
			status: response.status,
		});
	}

	private mapFetchError(error: unknown): EngramError {
		if (isAbortSignalError(error)) {
			return new EngramError("timeout", {
				code: "ENGINE_TIMEOUT",
				message: `engram request timed out after ${this.timeoutMs}ms`,
				cause: error,
			});
		}
		const message = error instanceof Error ? error.message : String(error);
		return new EngramError("network", {
			code: "ENGINE_UNREACHABLE",
			message: `engram sidecar unreachable: ${message}`,
			cause: error,
		});
	}
}

// ──────────────────────────────────────────────
// Response parsing (unknown → precise types)
// ──────────────────────────────────────────────

function invalidResponse(message: string): EngramError {
	return new EngramError("invalid-response", {
		code: "INVALID_RESPONSE",
		message,
	});
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readErrorDetail(
	body: unknown,
): { code?: string; message?: string } | null {
	if (!isRecord(body) || !isRecord(body.error)) return null;
	const code = body.error.code;
	const message = body.error.message;
	return {
		...(typeof code === "string" ? { code } : {}),
		...(typeof message === "string" ? { message } : {}),
	};
}

function isAbortSignalError(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"name" in error &&
		(error.name === "TimeoutError" || error.name === "AbortError")
	);
}

function requireString(value: unknown, field: string): string {
	if (typeof value !== "string") {
		throw invalidResponse(`engram response field "${field}" must be a string`);
	}
	return value;
}

function optionalString(value: unknown): string | undefined {
	return typeof value === "string" ? value : undefined;
}

function parseScope(value: unknown): EngramScope {
	if (!isRecord(value) || typeof value.kind !== "string") {
		throw invalidResponse(
			'engram response field "scope.kind" must be a string',
		);
	}
	const scope: EngramScope = { kind: value.kind as EngramScopeKind };
	const organizationId = optionalString(value.organizationId);
	const companyId = optionalString(value.companyId);
	const ruc = optionalString(value.ruc);
	const period = optionalString(value.period);
	if (organizationId !== undefined) scope.organizationId = organizationId;
	if (companyId !== undefined) scope.companyId = companyId;
	if (ruc !== undefined) scope.ruc = ruc;
	if (period !== undefined) scope.period = period;
	return scope;
}

function parseContent(value: unknown): EngramContent {
	if (!isRecord(value)) {
		throw invalidResponse('engram response field "content" must be an object');
	}
	return {
		what: requireString(value.what, "content.what"),
		why: requireString(value.why, "content.why"),
		where: requireString(value.where, "content.where"),
		learned: requireString(value.learned, "content.learned"),
	};
}

function parseProvenance(value: unknown): EngramProvenance {
	if (!isRecord(value)) {
		throw invalidResponse(
			'engram response field "provenance" must be an object',
		);
	}
	const provenance: EngramProvenance = {
		actor: requireString(value.actor, "provenance.actor"),
		timestamp: requireString(value.timestamp, "provenance.timestamp"),
		source: requireString(value.source, "provenance.source"),
	};
	const session = optionalString(value.session);
	if (session !== undefined) provenance.session = session;
	return provenance;
}

function parseValidity(value: unknown): EngramValidity | undefined {
	if (value === null || value === undefined) return undefined;
	if (!isRecord(value)) {
		throw invalidResponse('engram response field "validity" must be an object');
	}
	const validity: EngramValidity = {};
	const effectiveAt = optionalString(value.effectiveAt);
	const expiresAt = optionalString(value.expiresAt);
	if (effectiveAt !== undefined) validity.effectiveAt = effectiveAt;
	if (expiresAt !== undefined) validity.expiresAt = expiresAt;
	return validity;
}

function parseObservation(value: unknown): EngramObservation {
	if (!isRecord(value) || !isRecord(value.identity)) {
		throw invalidResponse("engram response observation must be an object");
	}
	const identity: EngramIdentity = {
		id: requireString(value.identity.id, "identity.id"),
		topicKey: requireString(value.identity.topicKey, "identity.topicKey"),
	};
	if (typeof value.revision !== "number") {
		throw invalidResponse('engram response field "revision" must be a number');
	}
	const observation: EngramObservation = {
		identity,
		title: requireString(value.title, "title"),
		type: requireString(value.type, "type"),
		scope: parseScope(value.scope),
		content: parseContent(value.content),
		authorityStatus: requireString(
			value.authorityStatus,
			"authorityStatus",
		) as EngramAuthorityStatus,
		provenance: parseProvenance(value.provenance),
		revision: value.revision,
	};
	const validity = parseValidity(value.validity);
	if (validity !== undefined) observation.validity = validity;
	return observation;
}

function parseObservations(value: unknown): EngramObservation[] {
	if (!Array.isArray(value)) {
		throw invalidResponse("engram GET /v1/context must return an array");
	}
	return value.map(parseObservation);
}

function parseSaveResponse(value: unknown): EngramSaveResponse {
	if (!isRecord(value)) {
		throw invalidResponse("engram save response must be an object");
	}
	if (typeof value.outcome !== "string") {
		throw invalidResponse(
			'engram save response field "outcome" must be a string',
		);
	}
	return {
		observation: parseObservation(value.observation),
		outcome: value.outcome as EngramWriteOutcome,
	};
}

function parseSearchResults(value: unknown): EngramSearchResult[] {
	if (!Array.isArray(value)) {
		throw invalidResponse("engram GET /v1/search must return an array");
	}
	return value.map((entry) => {
		if (!isRecord(entry)) {
			throw invalidResponse("engram search result must be an object");
		}
		if (typeof entry.score !== "number" || typeof entry.stale !== "boolean") {
			throw invalidResponse(
				'engram search result fields "score"/"stale" have invalid types',
			);
		}
		return {
			observation: parseObservation(entry.observation),
			score: entry.score,
			stale: entry.stale,
		};
	});
}

function parseDoctorReport(value: unknown): EngramDoctorReport {
	if (!isRecord(value)) {
		throw invalidResponse("engram doctor report must be an object");
	}
	const numericFields = [
		"schemaVersion",
		"observations",
		"revisionChains",
		"transitions",
		"relations",
	] as const;
	for (const field of numericFields) {
		if (typeof value[field] !== "number") {
			throw invalidResponse(`engram doctor field "${field}" must be a number`);
		}
	}
	return {
		schemaVersion: value.schemaVersion as number,
		storage: requireString(value.storage, "storage"),
		dbPath: requireString(value.dbPath, "dbPath"),
		observations: value.observations as number,
		revisionChains: value.revisionChains as number,
		transitions: value.transitions as number,
		relations: value.relations as number,
	};
}

// Re-exported for callers that want to keep the default timeout aligned.
export { DEFAULT_ENGRAM_TIMEOUT_MS };
