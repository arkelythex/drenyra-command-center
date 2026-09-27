export function serializeEvent(event) {
    const lines = [`event: ${event.type}`, `data: ${JSON.stringify(event)}`, ""];
    return lines.join("\n");
}
export function deserializeEvent(raw) {
    try {
        const lines = raw.split("\n");
        let eventType = "";
        let dataStr = "";
        for (const line of lines) {
            if (line.startsWith("event: ")) {
                eventType = line.slice("event: ".length);
            }
            else if (line.startsWith("data: ")) {
                dataStr = line.slice("data: ".length);
            }
        }
        if (!eventType || !dataStr) {
            return null;
        }
        if (!isKnownEventType(eventType)) {
            return null;
        }
        const parsed = JSON.parse(dataStr);
        if (typeof parsed.id !== "string" ||
            typeof parsed.runId !== "string" ||
            typeof parsed.timestamp !== "number") {
            return null;
        }
        if (parsed.type !== eventType) {
            return null;
        }
        return parsed;
    }
    catch {
        return null;
    }
}
export function isAgentEvent(data) {
    if (typeof data !== "object" || data === null) {
        return false;
    }
    const candidate = data;
    if (typeof candidate.id !== "string" ||
        typeof candidate.runId !== "string" ||
        typeof candidate.timestamp !== "number" ||
        typeof candidate.type !== "string") {
        return false;
    }
    if (!isKnownEventType(candidate.type)) {
        return false;
    }
    if (typeof candidate.payload !== "object" || candidate.payload === null) {
        return false;
    }
    return true;
}
const KNOWN_EVENT_TYPES = [
    "run_started",
    "thinking",
    "tool_call",
    "tool_result",
    "tool_error",
    "progress",
    "approval_required",
    "approval_decision",
    "usage",
    "complete",
    "error",
];
function isKnownEventType(type) {
    return KNOWN_EVENT_TYPES.includes(type);
}
//# sourceMappingURL=sse-helpers.js.map