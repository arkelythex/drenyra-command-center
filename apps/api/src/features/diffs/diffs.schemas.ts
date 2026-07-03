import { t } from "elysia";

export const ListDiffsQuery = t.Object({
	threadId: t.Optional(t.String()),
	client: t.Optional(t.String()),
	status: t.Optional(t.String()),
	type: t.Optional(t.String()),
	priority: t.Optional(t.String()),
	limit: t.Optional(t.String()),
	offset: t.Optional(t.String()),
});

export const DiffParams = t.Object({
	id: t.String(),
});

export const RejectBody = t.Object({
	reason: t.String({ minLength: 1 }),
});

export const RequestInfoBody = t.Object({
	question: t.String({ minLength: 1 }),
});

export const ListQueueQuery = t.Object({
	priority: t.Optional(t.String()),
	status: t.Optional(t.String()),
	client: t.Optional(t.String()),
	period: t.Optional(t.String()),
	agentType: t.Optional(t.String()),
	type: t.Optional(t.String()),
});

export const BatchApproveBody = t.Object({
	ids: t.Array(t.String()),
});

export const ActionBody = t.Object({});
