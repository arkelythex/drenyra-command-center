import type { MissionEvent } from "@drenyra/mission-domain";
import { parseSSEEvent, isKeepalive } from "@drenyra/mission-domain";

export async function* streamSSEEvents(
  response: Response,
  fromSequence = 0,
): AsyncGenerator<MissionEvent> {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (isKeepalive(line)) continue;

      const event = parseSSEEvent(line);
      if (!event) continue;

      if (event.sequence <= fromSequence) continue;

      yield event;
    }
  }
}

export async function executeSSEStream(
  missionId: string,
  body: unknown,
  lastEventId?: number,
): Promise<Response> {
  const API_BASE =
    import.meta.env.VITE_DRENYRA_API_URL ?? "http://localhost:3000";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    Authorization: `Bearer ${sessionStorage.getItem("drenyra-auth-token") ?? ""}`,
  };

  if (lastEventId !== undefined) {
    headers["Last-Event-ID"] = String(lastEventId);
  }

  const response = await fetch(`${API_BASE}/api/v1/missions/${missionId}/execute`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const message =
      typeof errBody === "object" && errBody !== null && "message" in errBody
        ? String((errBody as Record<string, unknown>).message)
        : `SSE error: ${response.status}`;
    throw Object.assign(new Error(message), {
      code: "SSE_ERROR",
      message,
      statusCode: response.status,
      isTimeout: false,
    });
  }

  return response;
}
