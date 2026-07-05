/**
 * Cognitive Stream — localStorage persistence for run id and activity timeline.
 *
 * Extracted from cognitive-stream.ts for maintainability.
 */

import type { CognitiveActivityEntry } from "./cognitive-stream-types";

const COGNITIVE_RUN_ID_KEY = "drenyra:cognitive-run-id";
const COGNITIVE_ACTIVITY_TIMELINE_KEY = "drenyra:cognitive-activity-timeline";

function getLocalStorage(): Storage | null {
	if (typeof window === "undefined") return null;
	return window.localStorage;
}

export function readPersistedRunId(): string | null {
	const storage = getLocalStorage();
	if (!storage) return null;
	return storage.getItem(COGNITIVE_RUN_ID_KEY);
}

export function writePersistedRunId(runId: string): void {
	const storage = getLocalStorage();
	if (!storage) return;
	storage.setItem(COGNITIVE_RUN_ID_KEY, runId);
}

export function readPersistedTimeline(): CognitiveActivityEntry[] {
	const storage = getLocalStorage();
	if (!storage) return [];

	const raw = storage.getItem(COGNITIVE_ACTIVITY_TIMELINE_KEY);
	if (!raw) return [];

	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return [];

		return parsed.filter((entry): entry is CognitiveActivityEntry => {
			if (!entry || typeof entry !== "object") return false;
			const candidate = entry as Partial<CognitiveActivityEntry>;
			return (
				typeof candidate.id === "string" &&
				typeof candidate.type === "string" &&
				typeof candidate.label === "string" &&
				typeof candidate.timestamp === "string"
			);
		});
	} catch {
		return [];
	}
}

export function writePersistedTimeline(
	entries: CognitiveActivityEntry[],
): void {
	const storage = getLocalStorage();
	if (!storage) return;
	storage.setItem(COGNITIVE_ACTIVITY_TIMELINE_KEY, JSON.stringify(entries));
}

export function clearPersistedTimeline(): void {
	const storage = getLocalStorage();
	if (!storage) return;
	storage.removeItem(COGNITIVE_ACTIVITY_TIMELINE_KEY);
}
