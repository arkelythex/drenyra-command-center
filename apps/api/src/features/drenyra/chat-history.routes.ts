import { db } from "@arkelythex/persistence";
import { chatSessions, messages } from "@arkelythex/persistence";
import { eq, desc, asc, and } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { ok, fail } from "../shared/api-response";

function readHeader(headers: Record<string, string | undefined>, key: string): string {
	return headers[key]?.trim() ?? "";
}

type ContextResolution =
	| { ok: true; companyId: string; userId: string }
	| { ok: false; status: number; error: ReturnType<typeof fail> };

function resolveContext(
	headers: Record<string, string | undefined>,
): ContextResolution {
	const companyId = readHeader(headers, "x-company-id");
	const userId = readHeader(headers, "x-user-id");

	if (!companyId) {
		return {
			ok: false,
			status: 400,
			error: fail("x-company-id header is required", "TENANT_CONTEXT_REQUIRED", {
				details: { missingHeaders: ["x-company-id"] },
			}),
		};
	}

	if (!userId) {
		return {
			ok: false,
			status: 400,
			error: fail("x-user-id header is required", "TENANT_CONTEXT_REQUIRED", {
				details: { missingHeaders: ["x-user-id"] },
			}),
		};
	}

	return { ok: true, companyId, userId };
}

export const chatHistoryRoutes = new Elysia({
	prefix: "/api/drenyra/chat",
	name: "drenyra-chat-history",
})
	.post(
		"/history",
		async ({ body, headers, set }) => {
			const ctx = resolveContext(headers);
			if (!ctx.ok) {
				set.status = ctx.status;
				return ctx.error;
			}

			const { messages: incomingMessages, companyId } = body;

			if (incomingMessages.length === 0) {
				set.status = 400;
				return fail("messages array cannot be empty", "VALIDATION_ERROR");
			}

			const timestamps = incomingMessages.map((m) => new Date(m.timestamp));
			const minTime = new Date(Math.min(...timestamps.map((t) => t.getTime())));
			const maxTime = new Date(Math.max(...timestamps.map((t) => t.getTime())));

			let sessionId: string;

			const existing = await db
				.select({ id: chatSessions.id })
				.from(chatSessions)
				.where(
					and(
						eq(chatSessions.companyId, companyId),
						eq(chatSessions.userId, ctx.userId),
					),
				)
				.orderBy(desc(chatSessions.updatedAt))
				.limit(1)
				.execute();

			if (existing.length > 0) {
				sessionId = existing[0].id;
				await db
					.update(chatSessions)
					.set({ updatedAt: new Date() })
					.where(eq(chatSessions.id, sessionId))
					.execute();
			} else {
				const inserted = await db
					.insert(chatSessions)
					.values({
						userId: ctx.userId,
						companyId,
						title: "Command Center Chat",
						createdAt: new Date(),
						updatedAt: new Date(),
					})
					.returning({ id: chatSessions.id })
					.execute();
				sessionId = inserted[0].id;
			}

			if (incomingMessages.length > 0) {
				await db
					.insert(messages)
					.values(
						incomingMessages.map((msg) => ({
							id: msg.id,
							sessionId,
							role: msg.role,
							content: msg.content,
							metadata: msg.artifactTypes
								? { artifactTypes: msg.artifactTypes }
								: null,
							createdAt: new Date(msg.timestamp),
						})),
					)
					.execute();
			}

			return ok({ success: true, sessionId });
		},
		{
			body: t.Object({
				messages: t.Array(
					t.Object({
						id: t.String({ minLength: 1 }),
						role: t.String({ minLength: 1 }),
						content: t.String({ minLength: 1 }),
						timestamp: t.String({ minLength: 1 }),
						artifactTypes: t.Optional(t.Array(t.String())),
					}),
					{ minItems: 1 },
				),
				companyId: t.String({ minLength: 1 }),
			}),
		},
	)
	.get(
		"/history",
		async ({ query, headers, set }) => {
			const ctx = resolveContext(headers);
			if (!ctx.ok) {
				set.status = ctx.status;
				return ctx.error;
			}

			const limit = query.limit ?? 100;

			const session = await db
				.select({ id: chatSessions.id })
				.from(chatSessions)
				.where(
					and(
						eq(chatSessions.companyId, query.companyId),
						eq(chatSessions.userId, ctx.userId),
					),
				)
				.orderBy(desc(chatSessions.updatedAt))
				.limit(1)
				.execute();

			if (session.length === 0) {
				return ok({ messages: [], sessionId: null });
			}

			const sessionId = session[0].id;

			const rows = await db
				.select({
					id: messages.id,
					role: messages.role,
					content: messages.content,
					metadata: messages.metadata,
					timestamp: messages.createdAt,
				})
				.from(messages)
				.where(eq(messages.sessionId, sessionId))
				.orderBy(asc(messages.createdAt))
				.limit(limit)
				.execute();

			const result = rows.map((row) => ({
				id: row.id,
				role: row.role,
				content: row.content,
				timestamp: row.timestamp.toISOString(),
				...(row.metadata && typeof row.metadata === "object" && "artifactTypes" in row.metadata
					? { artifactTypes: (row.metadata as { artifactTypes: string[] }).artifactTypes }
					: {}),
			}));

			return ok({ messages: result, sessionId });
		},
		{
			query: t.Object({
				companyId: t.String({ minLength: 1 }),
				limit: t.Optional(t.Numeric({ default: 100, minimum: 1, maximum: 1000 })),
			}),
		},
	);
