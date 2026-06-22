import { api, getGovernanceAuditHeaders } from "@/lib/api";
import { runtimeConfig } from "@/lib/runtime-config";
import { unwrap, extractOkData } from "@/lib/api-helpers";

export interface DrenyraChatRequest {
	message: string;
	sessionId?: string;
}

export interface DrenyraChatResponse {
	sessionId: string;
	agent: string;
	intent: {
		agent: string;
		tool: string;
		confidence: number;
	};
	result: {
		ok: boolean;
		data?: unknown;
		error?: string;
		code?: string;
		details?: { approvalId?: string };
	};
}

export interface DrenyraApproval {
	id: string;
	toolName: string;
	summary: string;
	module: string;
	approvalLevel: string;
	state: string;
	proposedAt: string;
	decidedAt?: string;
	companyId: string;
	ruc: string;
	reviewerId?: string;
	rationale?: string;
	reviewerRole?: string;
}

export interface SseEvent {
	event: string | null;
	data: string;
}

export function parseSseBuffer(buffer: string): {
	events: SseEvent[];
	rest: string;
} {
	const events: SseEvent[] = [];
	let cursor = 0;

	while (true) {
		const boundary = buffer.indexOf("\n\n", cursor);
		if (boundary === -1) break;

		const block = buffer.slice(cursor, boundary).trim();
		cursor = boundary + 2;
		if (!block) continue;

		let eventName: string | null = null;
		let data = "";

		for (const line of block.split("\n")) {
			if (line.startsWith("event:")) {
				eventName = line.slice(6).trim() || null;
			} else if (line.startsWith("data:")) {
				data = line.slice(5).trimStart();
			}
		}

		if (data) events.push({ event: eventName, data });
	}

	return { events, rest: buffer.slice(cursor) };
}

export function buildDrenyraStreamUrl(
	message: string,
	sessionId?: string,
): string {
	const baseUrl = runtimeConfig.apiUrl.replace(/\/+$/, "");
	const params = new URLSearchParams({ message });
	if (sessionId) params.set("sessionId", sessionId);
	return `${baseUrl}/api/drenyra/chat/stream?${params}`;
}

export const drenyraApi = {
	chat: async (request: DrenyraChatRequest): Promise<DrenyraChatResponse> => {
		const body = await unwrap(
			api.api.drenyra.chat.post(request, {
				headers: getGovernanceAuditHeaders(),
			}),
		);
		return extractOkData(body, "No se pudo procesar el mensaje");
	},

	getApprovals: async (): Promise<DrenyraApproval[]> => {
		const body = await unwrap(
			api.api.drenyra.approvals.get({
				headers: getGovernanceAuditHeaders(),
			}),
		);
		return extractOkData(body, "No se pudieron cargar las aprobaciones");
	},

	approve: async (approvalId: string, reviewerId: string, role: string) => {
		const body = await unwrap(
			api.api.drenyra.approve.post(
				{ approvalId, reviewerId, role },
				{ headers: getGovernanceAuditHeaders() },
			),
		);
		return extractOkData(body, "No se pudo aprobar");
	},

	reject: async (
		approvalId: string,
		reviewerId: string,
		rationale?: string,
	) => {
		const body = await unwrap(
			api.api.drenyra.reject.post(
				{ approvalId, reviewerId, rationale },
				{ headers: getGovernanceAuditHeaders() },
			),
		);
		return extractOkData(body, "No se pudo rechazar");
	},
};
