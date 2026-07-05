import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import type { CognitiveMessage } from "@/features/cognitive-hub/types/hub.types";
import { api as _rawApi, getGovernanceAuditHeaders } from "@/lib/api";

const api = _rawApi as unknown as { api: Record<string, unknown> };

import { extractOkData, unwrap } from "@/lib/api-helpers";
import { getCompanyContext } from "@/lib/company-context";
import { getActiveFiscalPeriod } from "@/lib/fiscal-period";

const STORAGE_PREFIX = "drenyra:chat:";
const MAX_MESSAGES = 100;
const SAVE_DEBOUNCE_MS = 500;

function getStorageKey(companyId: string): string {
	return `${STORAGE_PREFIX}${companyId}`;
}

function load(companyId: string): CognitiveMessage[] {
	try {
		const raw = localStorage.getItem(getStorageKey(companyId));
		if (!raw) return [];
		const parsed = JSON.parse(raw) as CognitiveMessage[];
		return parsed.map((msg) => ({
			...msg,
			timestamp: new Date(msg.timestamp),
		}));
	} catch {
		return [];
	}
}

function save(companyId: string, messages: CognitiveMessage[]): void {
	try {
		const trimmed =
			messages.length > MAX_MESSAGES ? messages.slice(-MAX_MESSAGES) : messages;
		localStorage.setItem(getStorageKey(companyId), JSON.stringify(trimmed));
	} catch (e) {
		console.error("useChatHistory: error saving to localStorage", e);
	}
}

function clearStorage(companyId: string): void {
	try {
		localStorage.removeItem(getStorageKey(companyId));
	} catch {
		// silent
	}
}

function getApiHeaders() {
	const companyContext = getCompanyContext();
	return {
		headers: {
			...getGovernanceAuditHeaders(),
			"x-company-ruc": companyContext.ruc,
			"x-fiscal-period": getActiveFiscalPeriod(),
		},
	};
}

interface ApiMessage {
	id: string;
	role: string;
	content: string;
	timestamp: string;
	artifactTypes?: string[];
}

interface ApiHistoryResponse {
	messages: ApiMessage[];
	sessionId: string;
}

function serializeForApi(messages: CognitiveMessage[]) {
	return messages.map(({ artifacts, timestamp, ...rest }) => ({
		...rest,
		timestamp: timestamp instanceof Date ? timestamp.toISOString() : timestamp,
		...(artifacts?.length
			? { artifactTypes: artifacts.map((a) => a.type) }
			: {}),
	}));
}

function reviveFromApi(apiMessages: ApiMessage[]): CognitiveMessage[] {
	return apiMessages.map(({ artifactTypes: _a, timestamp, ...rest }) => ({
		...rest,
		role: rest.role as CognitiveMessage["role"],
		timestamp: new Date(timestamp),
	}));
}

async function fetchFromApi(
	companyId: string,
): Promise<CognitiveMessage[] | null> {
	try {
		const body = await unwrap(
			api.api.drenyra.chat.history.get({
				query: { companyId, limit: MAX_MESSAGES },
				...getApiHeaders(),
			}),
		);
		const data = extractOkData<ApiHistoryResponse>(
			body,
			"Failed to load chat history",
		);
		return reviveFromApi(data.messages);
	} catch {
		return null;
	}
}

async function saveToApi(
	companyId: string,
	messages: CognitiveMessage[],
): Promise<void> {
	try {
		const serialized = serializeForApi(messages);
		await unwrap(
			api.api.drenyra.chat.history.post(
				{ messages: serialized, companyId },
				getApiHeaders(),
			),
		);
	} catch {
		// silent — localStorage is the fallback
	}
}

const listeners = new Set<() => void>();

function subscribe(notify: () => void): () => void {
	listeners.add(notify);
	return () => listeners.delete(notify);
}

function storageListener(event: StorageEvent) {
	if (event.key?.startsWith(STORAGE_PREFIX)) {
		for (const listener of listeners) listener();
	}
}

let registered = false;
function ensureRegistered() {
	if (registered) return;
	registered = true;
	window.addEventListener("storage", storageListener);
}

export function useChatHistory(companyId: string) {
	ensureRegistered();

	const snapshotCache = useRef<{
		key: string;
		data: CognitiveMessage[];
	} | null>(null);

	const invalidateCache = useCallback(() => {
		if (snapshotCache.current?.key === `${companyId}`) {
			snapshotCache.current = null;
		}
	}, [companyId]);

	const getSnapshot = useCallback(() => {
		const key = `${companyId}`;
		if (snapshotCache.current && snapshotCache.current.key === key) {
			return snapshotCache.current.data;
		}
		const data = load(companyId);
		snapshotCache.current = { key, data };
		return data;
	}, [companyId]);

	const messages = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		fetchFromApi(companyId).then((apiMessages) => {
			if (!apiMessages) return;
			save(companyId, apiMessages);
			invalidateCache();
			for (const listener of listeners) listener();
		});
	}, [companyId, invalidateCache]);

	const setMessages = useCallback(
		(
			updater:
				| CognitiveMessage[]
				| ((prev: CognitiveMessage[]) => CognitiveMessage[]),
		) => {
			const next =
				typeof updater === "function" ? updater(load(companyId)) : updater;
			save(companyId, next);
			invalidateCache();
			for (const listener of listeners) listener();

			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => {
				saveToApi(companyId, load(companyId));
			}, SAVE_DEBOUNCE_MS);
		},
		[companyId, invalidateCache],
	);

	const appendMessage = useCallback(
		(message: CognitiveMessage) => {
			setMessages((prev) => [...prev, message]);
		},
		[setMessages],
	);

	const updateMessage = useCallback(
		(id: string, updater: Partial<CognitiveMessage>) => {
			setMessages((prev) =>
				prev.map((m) => (m.id === id ? { ...m, ...updater } : m)),
			);
		},
		[setMessages],
	);

	const clearHistory = useCallback(() => {
		clearStorage(companyId);
		invalidateCache();
		for (const listener of listeners) listener();
		saveToApi(companyId, []);
	}, [companyId, invalidateCache]);

	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	return {
		messages,
		setMessages,
		appendMessage,
		updateMessage,
		clearHistory,
	};
}
