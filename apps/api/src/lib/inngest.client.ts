import { createLogger } from "./logger";

interface InngestEventPayload {
	name: string;
	data: Record<string, unknown>;
}

const logger = createLogger({ module: "lib/inngest-client" });

function resolveInngestBaseUrl(): string | null {
	const raw = process.env.INNGEST_URL?.trim();
	if (!raw) return null;
	return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export const inngest = {
	async send(payload: InngestEventPayload): Promise<void> {
		const baseUrl = resolveInngestBaseUrl();
		if (!baseUrl) {
			logger.warn(
				{ eventName: payload.name },
				"INNGEST_URL is not configured; event dispatch skipped",
			);
			return;
		}

		const response = await fetch(`${baseUrl}/e/drenyra-documents`, {
			method: "POST",
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			throw new Error(`Inngest event dispatch failed with status ${response.status}`);
		}
	},
};
