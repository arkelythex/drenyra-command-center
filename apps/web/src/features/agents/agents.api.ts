import { api, getGovernanceAuditHeaders } from "@/lib/api";
import { unwrap } from "@/lib/api-helpers";
import type {
	AgentFilters,
	AgentSessionStatusDTO,
	PaginatedAgentSessions,
} from "./agents.types";

export async function listSessions(
	filters?: AgentFilters,
): Promise<PaginatedAgentSessions> {
	return unwrap(
		api.api.agents.sessions.get({
			query: {
				...(filters?.client && { client: filters.client }),
				...(filters?.period && { period: filters.period }),
				...(filters?.status && { status: filters.status }),
				...(filters?.risk && { risk: filters.risk }),
				...(filters?.agentType && { agentType: filters.agentType }),
			},
			headers: getGovernanceAuditHeaders(),
		}),
	) as Promise<PaginatedAgentSessions>;
}

export async function getSession(id: string): Promise<AgentSessionStatusDTO> {
	return unwrap(
		api.api.agents.sessions({ id }).get({
			headers: getGovernanceAuditHeaders(),
		}),
	) as Promise<AgentSessionStatusDTO>;
}

export async function getTimeline(
	id: string,
): Promise<{ steps: AgentSessionStatusDTO["steps"] }> {
	return unwrap(
		api.api.agents.sessions({ id }).timeline.get({
			headers: getGovernanceAuditHeaders(),
		}),
	) as Promise<{ steps: AgentSessionStatusDTO["steps"] }>;
}

export async function pauseSession(id: string): Promise<{ success: boolean }> {
	return unwrap(
		api.api.agents.sessions({ id }).pause.post(undefined, {
			headers: getGovernanceAuditHeaders(),
		}),
	) as Promise<{ success: boolean }>;
}

export async function resumeSession(id: string): Promise<{ success: boolean }> {
	return unwrap(
		api.api.agents.sessions({ id }).resume.post(undefined, {
			headers: getGovernanceAuditHeaders(),
		}),
	) as Promise<{ success: boolean }>;
}

export async function cancelSession(id: string): Promise<{ success: boolean }> {
	return unwrap(
		api.api.agents.sessions({ id }).cancel.post(undefined, {
			headers: getGovernanceAuditHeaders(),
		}),
	) as Promise<{ success: boolean }>;
}
