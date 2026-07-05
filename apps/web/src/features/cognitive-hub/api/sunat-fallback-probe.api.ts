import { z } from "zod";
import type {
	CpeFallbackProbeBody,
	CpeFallbackProbeData,
} from "@/features/compliance/api/compliance-client";
import { getCpeValidatorClient } from "@/features/compliance/api/compliance-client";
import { unwrap } from "@/lib/api-helpers";

/** Inner payload of POST /cpe-validator/fallback/probe (aligned with API + `CpeFallbackProbeData`). */
const cpeFallbackProbeTraceSchema = z.object({
	source: z.literal("visual_subagent"),
	mode: z.literal("simulation"),
	steps: z.array(z.string()),
	txtPreview: z.string(),
	durationMs: z.number(),
});

const cpeFallbackHitlSchema = z.object({
	required: z.literal(true),
	challengeType: z.enum(["captcha", "unexpected_popup"]),
	channel: z.literal("whatsapp"),
	message: z.string(),
	screenshotRef: z.string(),
});

const cpeFallbackProbeDataSchema = z.object({
	source: z.literal("visual_subagent"),
	fallbackActivated: z.boolean(),
	response: z.unknown(),
	trace: cpeFallbackProbeTraceSchema,
	hitl: cpeFallbackHitlSchema.optional(),
});

const cpeFallbackProbeSuccessEnvelopeSchema = z.object({
	success: z.literal(true),
	data: cpeFallbackProbeDataSchema,
});

const cpeFallbackProbeFailureEnvelopeSchema = z.object({
	success: z.literal(false),
	error: z.string().optional(),
});

const cpeFallbackProbeEnvelopeSchema = z.discriminatedUnion("success", [
	cpeFallbackProbeSuccessEnvelopeSchema,
	cpeFallbackProbeFailureEnvelopeSchema,
]);

function parseProbeEnvelope(raw: unknown): CpeFallbackProbeData {
	const parsed = cpeFallbackProbeEnvelopeSchema.safeParse(raw);
	if (!parsed.success) {
		throw new Error("cpe-validator/fallback/probe: respuesta inválida");
	}
	if (parsed.data.success === false) {
		throw new Error(parsed.data.error ?? "cpe-validator/fallback/probe falló");
	}
	return parsed.data.data;
}

/**
 * POST /cpe-validator/fallback/probe via Eden (misma base que el resto del SPA).
 */
export async function postSunatFallbackProbe(
	body: CpeFallbackProbeBody,
): Promise<CpeFallbackProbeData> {
	const client = getCpeValidatorClient();
	const raw = await unwrap(client.fallback.probe.post(body));
	return parseProbeEnvelope(raw);
}
