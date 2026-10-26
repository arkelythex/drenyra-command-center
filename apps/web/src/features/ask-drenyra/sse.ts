export interface SseEvent {
	event: string;
	data: unknown;
}

/**
 * Parses Server-Sent Events from a text buffer. Returns the complete events and
 * the trailing partial text, which the caller prepends to the next chunk.
 * Events whose data is not JSON are dropped (the API only sends JSON data).
 */
export function parseSse(buffer: string): { events: SseEvent[]; rest: string } {
	const blocks = buffer.split("\n\n");
	const rest = blocks.pop() ?? "";
	const events: SseEvent[] = [];

	for (const block of blocks) {
		let event = "message";
		const dataLines: string[] = [];
		for (const line of block.split("\n")) {
			if (line.startsWith("event:")) event = line.slice(6).trim();
			else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
		}
		if (dataLines.length === 0) continue;
		try {
			events.push({ event, data: JSON.parse(dataLines.join("\n")) });
		} catch {
			// Not JSON: not part of the cognitive-stream contract, skip it.
		}
	}

	return { events, rest };
}
