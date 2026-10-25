import type { MissionSnapshot } from "@drenyra/mission-domain";
import type { Dispatch, MutableRefObject } from "react";
import { useCallback } from "react";
import {
	type CreateMissionInput,
	createMission,
	executeMission,
	getMission,
} from "../services/http-mission-transport";
import { isHarnessError } from "../services/mission-errors";
import { toMissionState } from "./mission-snapshot-state";
import type { MissionAction } from "./missionReducer";

const IS_MOCK = import.meta.env.VITE_DRENYRA_MISSION_TRANSPORT === "mock";

/** Statuses in which the server is still working; the client keeps polling. */
const IN_PROGRESS = new Set(["QUEUED", "RUNNING", "RECOVERING", "RETRYING"]);

export const MISSION_POLL_INTERVAL_MS = 1_500;
/** About five minutes of polling; after that the user can reconnect. */
export const MISSION_MAX_POLLS = 200;

const wait = (ms: number, signal: AbortSignal) =>
	new Promise<void>((resolve) => {
		const timer = setTimeout(resolve, ms);
		signal.addEventListener("abort", () => {
			clearTimeout(timer);
			resolve();
		});
	});

/**
 * Creates the mission, or loads the one that already exists for the period
 * (the API allows one per company, period and intent and answers 409 with
 * its id).
 */
async function createOrResume(
	command: CreateMissionInput,
): Promise<MissionSnapshot> {
	try {
		return await createMission(command);
	} catch (error: unknown) {
		const existingId = isHarnessError(error)
			? error.statusCode === 409 && error.details?.missionId
			: undefined;
		if (typeof existingId !== "string") throw error;
		return getMission(existingId);
	}
}

/**
 * Starts a mission on the server: create it, execute it with the version the
 * server returned, then follow its snapshot until it stops progressing
 * (awaiting approval, blocked or finished).
 */
export function useMissionExecution(
	dispatch: Dispatch<MissionAction>,
	abortRef: MutableRefObject<AbortController | null>,
	missionIdRef: MutableRefObject<string | null>,
) {
	const runMock = useCallback(
		async (command: CreateMissionInput, signal: AbortSignal) => {
			const { mockExecuteRunIntent } = await import(
				"../services/mock-mission-transport"
			);
			const mockId = crypto.randomUUID();
			missionIdRef.current = mockId;
			for await (const snapshot of mockExecuteRunIntent(
				mockId,
				command.input.instruction,
			)) {
				if (signal.aborted) break;
				dispatch({
					type: "MISSION_EVENT_RECEIVED",
					event: toMissionState(snapshot, true),
				});
			}
		},
		[dispatch, missionIdRef],
	);

	const runServer = useCallback(
		async (command: CreateMissionInput, signal: AbortSignal) => {
			const created = await createOrResume(command);
			missionIdRef.current = created.id;
			dispatch({
				type: "MISSION_EVENT_RECEIVED",
				event: toMissionState(created),
			});

			// A resumed mission that already ran is only followed, not re-run.
			let snapshot =
				created.status === "DRAFT"
					? await executeMission(created.id, {
							expectedMissionVersion: created.version,
						})
					: created;
			dispatch({
				type: "MISSION_EVENT_RECEIVED",
				event: toMissionState(snapshot),
			});

			for (
				let poll = 0;
				poll < MISSION_MAX_POLLS && IN_PROGRESS.has(snapshot.status);
				poll++
			) {
				await wait(MISSION_POLL_INTERVAL_MS, signal);
				if (signal.aborted) return;
				snapshot = await getMission(created.id);
				dispatch({
					type: "MISSION_EVENT_RECEIVED",
					event: toMissionState(snapshot),
				});
			}
		},
		[dispatch, missionIdRef],
	);

	const run = useCallback(
		async (command: CreateMissionInput) => {
			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;

			try {
				await (IS_MOCK ? runMock : runServer)(command, controller.signal);
			} catch (error: unknown) {
				if ((error as Error).name === "AbortError") return;
				const isTimeout =
					typeof error === "object" &&
					error !== null &&
					"isTimeout" in error &&
					(error as Record<string, unknown>).isTimeout === true;

				dispatch({
					type: "ERROR_OCCURRED",
					error: (error as Error).message ?? "Error desconocido",
					isTimeout,
				});
			}
		},
		[dispatch, abortRef, runMock, runServer],
	);

	const abort = useCallback(() => {
		abortRef.current?.abort();
	}, [abortRef]);

	return { run, abort };
}
