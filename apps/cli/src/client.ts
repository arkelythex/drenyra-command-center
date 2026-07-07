/**
 * HTTP client for drenyra-pi API.
 */

import type { AgentSession, AgentStepDTO } from "./types.js";

const DEFAULT_PI_URL = "http://localhost:7377";

let piUrl = DEFAULT_PI_URL;

export function setPiUrl(url: string): void {
	piUrl = url;
}

export function getPiUrl(): string {
	return piUrl;
}

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: { code: string; message: string };
	meta?: { traceId: string; durationMs: number };
}

async function request<T>(
	method: string,
	path: string,
	body?: unknown,
): Promise<ApiResponse<T>> {
	const url = `${piUrl}${path}`;
	const options: RequestInit = {
		method,
		headers: { "Content-Type": "application/json" },
	};
	if (body && method !== "GET") {
		options.body = JSON.stringify(body);
	}
	const res = await fetch(url, options);
	return res.json() as Promise<ApiResponse<T>>;
}

// ─── Session API ────────────────────────────────────────────────────────

export async function listSessions(
	status?: string,
): Promise<ApiResponse<AgentSession[]>> {
	const qs = status ? `?status=${status}` : "";
	return request<AgentSession[]>("GET", `/api/v1/sessions${qs}`);
}

export async function getSession(
	id: string,
): Promise<ApiResponse<AgentSession>> {
	return request<AgentSession>("GET", `/api/v1/sessions/${id}`);
}

export async function createSession(
	goal: string,
	context: Record<string, unknown>,
): Promise<ApiResponse<{ sessionId: string }>> {
	return request<{ sessionId: string }>("POST", "/api/v1/sessions", {
		goal,
		context,
	});
}

export async function pauseSession(
	id: string,
): Promise<ApiResponse<{ sessionId: string; status: string }>> {
	return request<{ sessionId: string; status: string }>(
		"POST",
		`/api/v1/sessions/${id}/pause`,
	);
}

export async function resumeSession(
	id: string,
): Promise<ApiResponse<{ sessionId: string; status: string }>> {
	return request<{ sessionId: string; status: string }>(
		"POST",
		`/api/v1/sessions/${id}/resume`,
	);
}

export async function cancelSession(
	id: string,
): Promise<ApiResponse<{ sessionId: string; status: string }>> {
	return request<{ sessionId: string; status: string }>(
		"POST",
		`/api/v1/sessions/${id}/cancel`,
	);
}

export async function getSessionTimeline(
	id: string,
): Promise<ApiResponse<AgentStepDTO[]>> {
	return request<AgentStepDTO[]>("GET", `/api/v1/sessions/${id}/timeline`);
}

// ─── Agent API ──────────────────────────────────────────────────────────

export async function runAgent(
	agentId: string,
	task: Record<string, unknown>,
	context: Record<string, unknown>,
): Promise<ApiResponse<{ executionId: string }>> {
	return request<{ executionId: string }>("POST", `/api/v1/agents/${agentId}`, {
		task,
		context,
	});
}

// ─── Workflow API ───────────────────────────────────────────────────────

export async function runWorkflow(
	name: string,
	input: Record<string, unknown>,
): Promise<ApiResponse<{ workflowId: string }>> {
	return request<{ workflowId: string }>("POST", "/api/v1/workflows/run", {
		workflow: name,
		input,
	});
}

export async function getWorkflowStatus(
	id: string,
): Promise<ApiResponse<Record<string, unknown>>> {
	return request<Record<string, unknown>>("GET", `/api/v1/workflows/${id}`);
}

// ─── Health API ─────────────────────────────────────────────────────────

// ─── Skills API ────────────────────────────────────────────────────────────

export interface SkillDTO {
	id: string;
	name: string;
	version: string;
	description: string;
}

export async function listSkills(): Promise<ApiResponse<SkillDTO[]>> {
	return request<SkillDTO[]>("GET", "/api/v1/skills");
}

export async function installSkill(
	pkg: string,
	version?: string,
): Promise<ApiResponse<{ skillId: string }>> {
	return request<{ skillId: string }>("POST", "/api/v1/skills/install", {
		package: pkg,
		version,
	});
}

export async function uninstallSkill(
	id: string,
): Promise<ApiResponse<{ id: string; status: string }>> {
	return request<{ id: string; status: string }>(
		"POST",
		`/api/v1/skills/${id}/uninstall`,
	);
}

export async function getHealth(): Promise<
	ApiResponse<{
		status: string;
		version: string;
		skills: number;
		uptime: number;
	}>
> {
	return request<{
		status: string;
		version: string;
		skills: number;
		uptime: number;
	}>("GET", "/api/v1/health");
}
