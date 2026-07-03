/**
 * Agents Feature — Elysia Validation Schemas
 *
 * @module features/agents/agents.schemas
 */

import { t } from "elysia";

/** Query parameters for listing agent sessions */
export const ListSessionsQuery = t.Object({
	client: t.Optional(t.String({ minLength: 1 })),
	period: t.Optional(t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" })),
	status: t.Optional(t.String({ minLength: 1 })),
	risk: t.Optional(t.String({ minLength: 1 })),
	agentType: t.Optional(t.String({ minLength: 1 })),
	limit: t.Optional(t.String()),
	offset: t.Optional(t.String()),
});

/** Route parameter for session ID */
export const SessionParams = t.Object({
	id: t.String({ minLength: 1 }),
});

/** Body for session action endpoints (currently empty — actions are idempotent) */
export const ActionBody = t.Object({});
