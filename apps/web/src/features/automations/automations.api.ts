import { api } from "@/lib/api";
import { unwrap } from "@/lib/api-helpers";

export interface AutomationDTO {
	id: string;
	companyId: string;
	name: string;
	description?: string;
	triggerType: string;
	triggerConfig: Record<string, unknown>;
	status: string;
	skills: Array<{ id: string; name: string }>;
	autonomy: string;
	lastRunAt?: string;
	lastRunStatus?: string;
	runCount: number;
}

export interface AutomationDetailDTO extends AutomationDTO {
	executionLogs: AutomationLogEntry[];
}

export interface AutomationLogEntry {
	id: string;
	automationId: string;
	status: string;
	startedAt: string;
	completedAt?: string;
	resultSummary?: string;
	error?: string;
}

export interface CreateAutomationBody {
	name: string;
	description?: string;
	triggerType: "schedule" | "event" | "manual";
	triggerConfig: Record<string, unknown>;
	skillIds: string[];
	autonomy: "suggest" | "auto-approve" | "execute";
}

export async function listAutomations(): Promise<{ data: AutomationDTO[] }> {
	return unwrap(
		api.api.automations.index.get(),
	) as Promise<{ data: AutomationDTO[] }>;
}

export async function getAutomationDetail(
	id: string,
): Promise<AutomationDetailDTO> {
	return unwrap(
		api.api.automations({ id }).get(),
	) as Promise<AutomationDetailDTO>;
}

export async function createAutomation(
	body: CreateAutomationBody,
): Promise<{ id: string; name: string }> {
	return unwrap(
		api.api.automations.index.post(body),
	) as Promise<{ id: string; name: string }>;
}

export async function toggleAutomation(
	id: string,
	active: boolean,
): Promise<{ id: string; name: string; status: string; active: boolean }> {
	return unwrap(
		api.api.automations({ id }).toggle.post({ active }),
	) as Promise<{ id: string; name: string; status: string; active: boolean }>;
}

export async function getAutomationLogs(
	id: string,
): Promise<{ data: AutomationLogEntry[] }> {
	return unwrap(
		api.api.automations({ id }).logs.get(),
	) as Promise<{ data: AutomationLogEntry[] }>;
}

export async function runAutomation(
	automationId: string,
): Promise<{ executionId: string }> {
	return unwrap(
		api.api.automations.run.post({ automationId }),
	) as Promise<{ executionId: string }>;
}

// ─── Query Keys ───

export const automationKeys = {
	all: ["automations"] as const,
	lists: () => [...automationKeys.all, "list"] as const,
	list: (filters?: Record<string, unknown>) =>
		[...automationKeys.lists(), filters] as const,
	details: () => [...automationKeys.all, "detail"] as const,
	detail: (id: string) => [...automationKeys.details(), id] as const,
	logs: (id: string) => [...automationKeys.all, "logs", id] as const,
};
