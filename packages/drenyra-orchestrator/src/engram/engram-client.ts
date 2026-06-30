/**
 * TypeScript HTTP client for drenyra-engram sidecar.
 * Mirrors packages/drenyra-engram/pkg/client/client.go contract.
 */

import type { GateEvidenceRecord } from "../phase/gate-evidence-recorder";

export interface EngramEvidencePayload {
	id: string;
	operationId: string;
	phase: string;
	tier: "T1_ADVISORY" | "T2_STRONG" | "T3_CRITICAL";
	timestamp: string;
	actor: "ai" | "human" | "system";
	action: string;
	input: unknown;
	output: unknown;
	reasoning?: string;
	metadata?: Record<string, unknown>;
	tenantId: string;
	ruc: string;
	companyId: string;
	userId?: string;
	traceId: string;
}

export interface EngramClientOptions {
	baseUrl?: string;
	timeoutMs?: number;
	fetchImpl?: typeof fetch;
}

function mapPhaseId(phaseId: string): string {
	const map: Record<string, string> = {
		captura: "extract",
		clasificacion: "classify",
		conciliacion: "validate",
		cierre: "comply",
		declaracion: "approve",
		auditoria: "archive",
	};
	return map[phaseId] ?? "validate";
}

export function gateEvidenceToEngramPayload(
	entry: GateEvidenceRecord,
	companyId: string,
): EngramEvidencePayload {
	return {
		id: `gate-${entry.gateId}-${entry.evaluatedAt}`,
		operationId: `${entry.ruc}:${entry.periodo}:${entry.phaseId}`,
		phase: mapPhaseId(entry.phaseId),
		tier: entry.tier,
		timestamp: entry.evaluatedAt,
		actor: "system",
		action: entry.gateName,
		input: { gateId: entry.gateId, severity: entry.severity },
		output: { passed: entry.passed, summary: entry.summary },
		reasoning: entry.summary,
		metadata: {
			gateId: entry.gateId,
			phaseId: entry.phaseId,
			periodo: entry.periodo,
		},
		tenantId: companyId,
		ruc: entry.ruc,
		companyId,
		traceId: `${entry.ruc}-${entry.periodo}-${entry.gateId}`,
	};
}

export class EngramHttpClient {
	private readonly baseUrl: string;
	private readonly timeoutMs: number;
	private readonly fetchImpl: typeof fetch;

	constructor(options: EngramClientOptions = {}) {
		this.baseUrl =
			options.baseUrl ??
			process.env.DRENYRA_ENGRAM_URL ??
			"http://localhost:8733";
		this.timeoutMs = options.timeoutMs ?? 10_000;
		this.fetchImpl = options.fetchImpl ?? fetch;
	}

	async health(): Promise<boolean> {
		try {
			const response = await this.request<{ status: string }>("GET", "/health");
			return response.status === "ok";
		} catch {
			return false;
		}
	}

	async saveEvidence(payload: EngramEvidencePayload): Promise<void> {
		await this.request("POST", "/api/v1/evidence", payload);
	}

	private async request<T>(
		method: string,
		path: string,
		body?: unknown,
	): Promise<T> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.timeoutMs);

		try {
			const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
				method,
				headers: { "Content-Type": "application/json" },
				body: body ? JSON.stringify(body) : undefined,
				signal: controller.signal,
			});

			if (!response.ok) {
				const text = await response.text();
				throw new Error(`Engram API ${response.status}: ${text}`);
			}

			if (response.status === 204) {
				return undefined as T;
			}

			return (await response.json()) as T;
		} finally {
			clearTimeout(timer);
		}
	}
}

export function createEngramGateEvidenceRecorder(
	client: EngramHttpClient,
	resolveCompanyId: (ruc: string) => Promise<string> | string,
): import("../phase/gate-evidence-recorder").GateEvidenceRecorder {
	return {
		async record(entry) {
			const companyId = await resolveCompanyId(entry.ruc);
			await client.saveEvidence(gateEvidenceToEngramPayload(entry, companyId));
		},
	};
}

export function createEngramGateEvidenceRecorderFromEnv(
	resolveCompanyId: (ruc: string) => Promise<string> | string = (ruc) => ruc,
): import("../phase/gate-evidence-recorder").GateEvidenceRecorder | undefined {
	const enabled = process.env.DRENYRA_ENGRAM_ENABLED !== "false";
	if (!enabled) return undefined;
	return createEngramGateEvidenceRecorder(
		new EngramHttpClient(),
		resolveCompanyId,
	);
}
