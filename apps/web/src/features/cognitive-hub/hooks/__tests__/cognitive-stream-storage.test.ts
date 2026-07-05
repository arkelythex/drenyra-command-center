import { beforeEach, describe, expect, it } from "vitest";
import {
	clearPersistedTimeline,
	readPersistedRunId,
	readPersistedTimeline,
	writePersistedRunId,
	writePersistedTimeline,
} from "../cognitive-stream";

const RUN_ID_KEY = "drenyra:cognitive-run-id";
const TIMELINE_KEY = "drenyra:cognitive-activity-timeline";

describe("cognitive stream storage helpers", () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it("persists and restores run id", () => {
		expect(readPersistedRunId()).toBeNull();

		writePersistedRunId("run-abc-123");
		expect(readPersistedRunId()).toBe("run-abc-123");
	});

	it("persists and restores timeline entries", () => {
		writePersistedTimeline([
			{
				id: "e1",
				runId: "run-1",
				type: "run_started",
				label: "Run iniciado",
				detail: null,
				status: "info",
				timestamp: "2026-02-19T12:00:00.000Z",
			},
		]);

		const entries = readPersistedTimeline();
		expect(entries).toHaveLength(1);
		expect(entries[0]?.id).toBe("e1");
	});

	it("returns empty timeline for invalid payload and supports clear", () => {
		window.localStorage.setItem(TIMELINE_KEY, "{not-json");
		expect(readPersistedTimeline()).toEqual([]);

		window.localStorage.setItem(
			TIMELINE_KEY,
			JSON.stringify([{ broken: true }]),
		);
		expect(readPersistedTimeline()).toEqual([]);

		writePersistedTimeline([
			{
				id: "e2",
				runId: null,
				type: "done",
				label: "Run finalizado",
				detail: "stop",
				status: "success",
				timestamp: "2026-02-19T12:00:00.000Z",
			},
		]);
		clearPersistedTimeline();
		expect(window.localStorage.getItem(TIMELINE_KEY)).toBeNull();
	});

	it("does not mutate unrelated localStorage keys", () => {
		window.localStorage.setItem(RUN_ID_KEY, "run-keep");
		clearPersistedTimeline();
		expect(window.localStorage.getItem(RUN_ID_KEY)).toBe("run-keep");
	});
});
