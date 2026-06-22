/**
 * Cognitive Stream schemas.
 */
import { t } from "elysia";

export const CognitiveStreamRequestSchema = t.Object({
	companyId: t.String({ minLength: 1 }),
	messages: t.Array(
		t.Object({
			role: t.Union([
				t.Literal("user"),
				t.Literal("assistant"),
				t.Literal("system"),
			]),
			content: t.String(),
		}),
	),
	modelTier: t.Optional(
		t.Union([
			t.Literal("reasoning"),
			t.Literal("fast"),
			t.Literal("code"),
			t.Literal("vision"),
		]),
	),
	tools: t.Optional(t.Boolean()),
	runId: t.Optional(t.String({ minLength: 1 })),
});

export const CognitiveApprovalDecisionSchema = t.Object({
	companyId: t.String({ minLength: 1 }),
	runId: t.String({ minLength: 1 }),
	toolCallId: t.String({ minLength: 1 }),
	approved: t.Boolean(),
	pairingCode: t.Optional(t.String({ minLength: 1, maxLength: 32 })),
	reason: t.Optional(t.String()),
	decidedBy: t.Optional(t.String()),
});

export const CognitiveRunStateParamsSchema = t.Object({
	runId: t.String({ minLength: 1 }),
});

export const RecoverRunParamsSchema = t.Object({
	runId: t.String({ format: "uuid" }),
});

export const RecoverRunBodySchema = t.Object({
	inputData: t.String({ minLength: 1 }),
	inputType: t.String({ minLength: 1 }),
});

export const CognitiveRunStateQuerySchema = t.Object({
	companyId: t.String({ minLength: 1 }),
});
