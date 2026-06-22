import { runtimeConfig } from "@/lib/runtime-config";
import { getGovernanceAuditHeaders } from "@/lib/api";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import type { DrenyraBrainItem, DrenyraBrainThread } from "@arkelythex/domain/drenyra";
import { parseSseBuffer, type SseEvent } from "./drenyra.api";

function getBrainHeaders(): Record<string, string> {
	const state = useAuthStore.getState();
	const user = state.user;

	const activeCompanyId = user?.activeCompanyId || user?.companyId || "";
	const activeCompany = user?.availableCompanies?.find(
		(c) => c.companyId === activeCompanyId,
	);

	const now = new Date();
	const fiscalPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

	return {
		...getGovernanceAuditHeaders(),
		"x-organization-id": user?.companyId || activeCompanyId,
		"x-company-ruc": activeCompany?.ruc || user?.ruc || "",
		"x-fiscal-period": fiscalPeriod,
	};
}

function apiBase(): string {
	return runtimeConfig.apiUrl.replace(/\/+$/, "");
}

export async function createBrainThread(
	title: string,
	linkedCaseId?: string,
): Promise<DrenyraBrainThread> {
	const response = await fetch(`${apiBase()}/api/drenyra/brain/threads`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...getBrainHeaders(),
		},
		body: JSON.stringify({
			title,
			sourceSurface: "web",
			...(linkedCaseId ? { linkedCaseId } : {}),
		}),
	});

	if (!response.ok) {
		const body = await response.json().catch(() => ({}));
		throw new Error(
			(body as { error?: string }).error ?? "Failed to create brain thread",
		);
	}

	const data = await response.json();
	if (data.data) return data.data as DrenyraBrainThread;
	return data as DrenyraBrainThread;
}

export async function getThreadItems(
	threadId: string,
): Promise<DrenyraBrainItem[]> {
	const response = await fetch(
		`${apiBase()}/api/drenyra/brain/threads/${encodeURIComponent(threadId)}/items`,
		{
			headers: getBrainHeaders(),
		},
	);

	if (!response.ok) {
		if (response.status === 404) return [];
		const body = await response.json().catch(() => ({}));
		throw new Error(
			(body as { error?: string }).error ?? "Failed to load thread items",
		);
	}

	const data = await response.json();
	if (data.data) return data.data as DrenyraBrainItem[];
	return data as DrenyraBrainItem[];
}

export async function listBrainThreads(): Promise<DrenyraBrainThread[]> {
	const response = await fetch(`${apiBase()}/api/drenyra/brain/threads`, {
		headers: getBrainHeaders(),
	});

	if (!response.ok) {
		throw new Error("Failed to list brain threads");
	}

	const data = await response.json();
	if (data.data) return data.data as DrenyraBrainThread[];
	return data as DrenyraBrainThread[];
}

export interface StreamCallbacks {
	onToken: (token: string) => void;
	onDone: (result: { threadId: string; turnId: string }) => void;
	onError: (error: string) => void;
}

export async function streamChat(
	message: string,
	threadId: string,
	callbacks: StreamCallbacks,
	signal?: AbortSignal,
): Promise<void> {
	const response = await fetch(`${apiBase()}/api/drenyra/brain/chat`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "text/event-stream",
			...getBrainHeaders(),
		},
		body: JSON.stringify({ message, threadId }),
		signal,
	});

	if (!response.ok) {
		const body = await response.json().catch(() => ({}));
		throw new Error(
			(body as { error?: string }).error ?? "Chat request failed",
		);
	}

	if (!response.body) {
		throw new Error("No response body from chat stream");
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	while (true) {
		const { done, value } = await reader.read();
		if (done) {
			const { events } = parseSseBuffer(buffer + "\n\n");
			for (const event of events) {
				processEvent(event, callbacks);
			}
			break;
		}

		buffer += decoder.decode(value, { stream: true });
		const { events, rest } = parseSseBuffer(buffer);
		buffer = rest;

		for (const event of events) {
			processEvent(event, callbacks);
		}
	}
}

function processEvent(
	event: SseEvent,
	callbacks: StreamCallbacks,
): void {
	try {
		const payload = JSON.parse(event.data) as Record<string, unknown>;

		switch (event.event) {
			case "token":
				if (typeof payload.token === "string") {
					callbacks.onToken(payload.token);
				}
				break;
			case "done":
				callbacks.onDone({
					threadId: (payload.threadId as string) ?? "",
					turnId: (payload.turnId as string) ?? "",
				});
				break;
			case "error":
				callbacks.onError(
					(payload.error as string) ?? "Unknown streaming error",
				);
				break;
		}
	} catch {
		// skip malformed events
	}
}
