import type { MissionIntentHandler } from "../../intent-handlers/mission-intent-handler.interface";

/**
 * A handler that accepts the mission and does nothing, for tests that drive
 * the state machine by hand. Executing a mission without any handler is
 * refused, since nothing would ever move it past RUNNING.
 */
export function idleIntentHandlers(
	intents: string[] = ["monthly-close"],
): Map<string, MissionIntentHandler> {
	const idle: MissionIntentHandler = {
		onRunning: async () => {},
		onApproved: async () => {},
	};
	return new Map(intents.map((intent) => [intent, idle]));
}
