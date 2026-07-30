import type { MissionEventStore } from "./mission-event-store";
import type { MissionSnapshot } from "@drenyra/mission-domain";

const HEARTBEAT_INTERVAL_MS = 15_000;
const POLL_INTERVAL_MS = 1_000;

export async function* missionSSEStream(
  eventStore: MissionEventStore,
  missionId: string,
  lastEventId: string | null,
  _getSnapshot: () => Promise<MissionSnapshot | null>,
): AsyncGenerator<string, void, undefined> {
  // Phase 1: CATCHUP — replay stored events
  const fromSeq = lastEventId ? parseInt(lastEventId, 10) : 0;
  const stored = await eventStore.getEventsSince(missionId, fromSeq);
  let lastSeq = fromSeq;

  for (const event of stored) {
    yield `id: ${event.sequence}\ndata: ${JSON.stringify(event)}\n\n`;
    lastSeq = Math.max(lastSeq, event.sequence as number);
  }

  // Phase 2: SUBSCRIBE — polling fallback
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let aborted = false;

  const abort = () => {
    aborted = true;
    if (heartbeatTimer !== null) clearInterval(heartbeatTimer);
    if (pollTimer !== null) clearInterval(pollTimer);
  };

  try {
    // Heartbeat every 15s
    heartbeatTimer = setInterval(async () => {
      if (aborted) return;
      // Push keepalive into the generator via a hack — actually we just yield in the main loop
    }, HEARTBEAT_INTERVAL_MS);

    // Poll every 1s for new events
    pollTimer = setInterval(async () => {
      if (aborted) return;
      // Actual polling happens in the main loop
    }, POLL_INTERVAL_MS);

    let lastHeartbeat = Date.now();

    while (!aborted) {
      // Check for new events
      const newEvents = await eventStore.getEventsSince(missionId, lastSeq);
      for (const event of newEvents) {
        yield `id: ${event.sequence}\ndata: ${JSON.stringify(event)}\n\n`;
        lastSeq = Math.max(lastSeq, event.sequence as number);
      }

      // Heartbeat
      const now = Date.now();
      if (now - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
        yield ":keepalive\n\n";
        lastHeartbeat = now;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  } finally {
    abort();
  }
}
