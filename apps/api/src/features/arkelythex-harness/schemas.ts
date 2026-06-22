import { t } from "elysia";

/** Elysia body schema for POST /harness/execute */
export const HarnessExecuteBodySchema = t.Object({
	task: t.String({ minLength: 1 }),
	rootAgentId: t.Optional(t.String()),
	autoSpawn: t.Optional(t.Boolean()),
	metadata: t.Optional(t.Record(t.String(), t.Any())),
});
