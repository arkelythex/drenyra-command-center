type OpenRouterRole = "system" | "user" | "assistant";

export type OpenRouterChatMessage = {
	role: OpenRouterRole;
	content: string;
};

type OpenRouterChatCompletionRequest = {
	model: string;
	messages: OpenRouterChatMessage[];
	temperature?: number;
	max_tokens?: number;
};

type OpenRouterChatCompletionResponse = {
	id: string;
	choices: Array<{
		index: number;
		message: { role: "assistant"; content: string | null };
		finish_reason?: string | null;
	}>;
};

function getOpenRouterBaseUrl(): string {
	return (
		process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1"
	);
}

function getOpenRouterApiKey(): string {
	const key = process.env.OPENROUTER_API_KEY?.trim();
	if (!key) throw new Error("OPENROUTER_API_KEY is required");
	return key;
}

function getOptionalAttributionHeaders(): Record<string, string> {
	// Optional but recommended by OpenRouter for attribution / analytics.
	// See: https://openrouter.ai/docs/api-reference/parameters (HTTP-Referer, X-Title)
	const headers: Record<string, string> = {};
	const referer = process.env.OPENROUTER_HTTP_REFERER?.trim();
	const title = process.env.OPENROUTER_APP_TITLE?.trim();
	if (referer) headers["HTTP-Referer"] = referer;
	if (title) headers["X-Title"] = title;
	return headers;
}

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

function coerceRetryAfterMs(value: string | null): number | null {
	if (!value) return null;
	const seconds = Number(value);
	if (!Number.isFinite(seconds) || seconds <= 0) return null;
	return Math.min(60_000, Math.round(seconds * 1000));
}

async function fetchWithRetries(
	input: RequestInfo,
	init: RequestInit,
	maxAttempts = 4,
): Promise<Response> {
	let attempt = 0;
	let backoffMs = 400;
	const totalAttempts = Math.max(1, maxAttempts);
	let lastResponse: Response | null = null;

	while (attempt < totalAttempts) {
		attempt += 1;
		const res = await fetch(input, init).catch((e) => {
			if (e instanceof Error) throw e;
			throw new Error(String(e));
		});
		lastResponse = res;

		if (res.status !== 429 && res.status < 500) return res;

		if (attempt >= totalAttempts) return res;

		const retryAfterMs = coerceRetryAfterMs(res.headers.get("retry-after"));
		await sleep(retryAfterMs ?? backoffMs);
		backoffMs = Math.min(8000, Math.round(backoffMs * 1.8));
	}

	if (lastResponse) {
		return lastResponse;
	}

	throw new Error("fetchWithRetries exhausted without a response");
}

function extractFirstJsonObject(text: string): string | null {
	const start = text.indexOf("{");
	if (start === -1) return null;

	let depth = 0;
	for (let i = start; i < text.length; i += 1) {
		const ch = text[i];
		if (ch === "{") depth += 1;
		if (ch === "}") depth -= 1;
		if (depth === 0) return text.slice(start, i + 1);
	}

	return null;
}

/**
 * Minimal OpenRouter client for JSON-only responses.
 *
 * OpenRouter provides an OpenAI-compatible API surface; we use `chat/completions`
 * because it is widely supported across models. Caller must provide a prompt that
 * returns strict JSON.
 */
export async function openRouterChatJson<T>(
	input: Omit<OpenRouterChatCompletionRequest, "model"> & { model?: string },
): Promise<{ data: T; rawText: string }> {
	const model =
		input.model?.trim() || process.env.OPENROUTER_DEFAULT_MODEL?.trim() || "";

	if (!model)
		throw new Error("OPENROUTER_DEFAULT_MODEL is required (or pass { model })");

	const url = `${getOpenRouterBaseUrl()}/chat/completions`;
	const res = await fetchWithRetries(url, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${getOpenRouterApiKey()}`,
			"Content-Type": "application/json",
			...getOptionalAttributionHeaders(),
		},
		body: JSON.stringify({
			model,
			messages: input.messages,
			temperature: input.temperature ?? 0.2,
			max_tokens: input.max_tokens ?? 700,
		} satisfies OpenRouterChatCompletionRequest),
	});

	const text = await res.text();
	if (!res.ok) {
		throw new Error(
			`OpenRouter error (HTTP ${res.status}): ${text.slice(0, 800)}`,
		);
	}

	const parsed = JSON.parse(text) as OpenRouterChatCompletionResponse;
	const rawText = parsed.choices?.[0]?.message?.content ?? "";

	const jsonText = extractFirstJsonObject(rawText) ?? rawText;
	const data = JSON.parse(jsonText) as T;

	return { data, rawText };
}
