import type { InboxSseEvent } from "./inbox.types";

export function toInboxSseChunk(event: InboxSseEvent): string {
	return `event: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`;
}

export function createInboxSseStream(
	run: (emit: (event: InboxSseEvent) => void) => Promise<void>,
): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder();

	return new ReadableStream<Uint8Array>({
		async start(controller) {
			let closed = false;
			const emit = (event: InboxSseEvent) => {
				if (closed) return;
				controller.enqueue(encoder.encode(toInboxSseChunk(event)));
			};

			try {
				await run(emit);
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Inbox process failed";
				emit({
					type: "invoice:error",
					payload: { invoiceId: "batch", error: message },
				});
			} finally {
				closed = true;
				controller.close();
			}
		},
	});
}
