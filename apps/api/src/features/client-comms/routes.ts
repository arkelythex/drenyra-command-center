import { db } from "@drenyra/persistence/client";
import { and, desc, eq, gte, lte, sql } from "@drenyra/persistence/query";
import {
	commAutomations,
	commHistory,
	commTemplates,
} from "@drenyra/persistence/schema";
import { Elysia, t } from "elysia";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import {
	BatchSendBody,
	CreateAutomationBody,
	CreateTemplateBody,
	SendBody,
	UpdateAutomationBody,
	UpdateTemplateBody,
} from "./types";

export const clientCommsRoutes = new Elysia({ prefix: "/api/v1/comms" })

	// ─── Templates ────────────────────────────────────────────────
	.post(
		"/templates",
		async ({ body, set }) => {
			try {
				const [template] = await db
					.insert(commTemplates)
					.values(body)
					.returning();
				return ok(template);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			body: CreateTemplateBody,
			detail: { tags: ["Client Comms"], summary: "Create template" },
		},
	)

	.get(
		"/templates",
		async ({ query, set }) => {
			try {
				const filters = [];
				if (query.channel)
					filters.push(eq(commTemplates.channel, query.channel));
				if (query.category)
					filters.push(eq(commTemplates.category, query.category));
				if (query.companyId)
					filters.push(eq(commTemplates.companyId, query.companyId));

				const templates = await db
					.select()
					.from(commTemplates)
					.where(and(...filters))
					.orderBy(desc(commTemplates.createdAt))
					.limit(100);
				return ok(templates);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: t.Object({
				companyId: t.Optional(t.String({ format: "uuid" })),
				channel: t.Optional(t.String()),
				category: t.Optional(t.String()),
			}),
			detail: { tags: ["Client Comms"], summary: "List templates" },
		},
	)

	.get(
		"/templates/:id",
		async ({ params: { id }, set }) => {
			try {
				const [template] = await db
					.select()
					.from(commTemplates)
					.where(eq(commTemplates.id, id))
					.limit(1);
				if (!template) {
					set.status = 404;
					return fail("Template not found", "NOT_FOUND");
				}
				return ok(template);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{ detail: { tags: ["Client Comms"], summary: "Get template" } },
	)

	.patch(
		"/templates/:id",
		async ({ params: { id }, body, set }) => {
			try {
				const [template] = await db
					.update(commTemplates)
					.set({ ...body, updatedAt: new Date() })
					.where(eq(commTemplates.id, id))
					.returning();
				if (!template) {
					set.status = 404;
					return fail("Template not found", "NOT_FOUND");
				}
				return ok(template);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			body: UpdateTemplateBody,
			detail: { tags: ["Client Comms"], summary: "Update template" },
		},
	)

	// ─── Send ─────────────────────────────────────────────────────
	.post(
		"/send",
		async ({ body, set }) => {
			try {
				const [entry] = await db
					.insert(commHistory)
					.values({
						companyId: body.companyId,
						templateId: body.templateId,
						clientId: body.clientId,
						channel: body.channel,
						recipient: body.recipient,
						body: JSON.stringify(body.variables ?? {}),
						status: "queued",
					})
					.returning();
				return ok(entry);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			body: SendBody,
			detail: { tags: ["Client Comms"], summary: "Send communication" },
		},
	)

	.post(
		"/send/batch",
		async ({ body, set }) => {
			try {
				const values = body.clientIds.map((clientId) => ({
					companyId: body.companyId,
					templateId: body.templateId,
					clientId,
					channel: body.channel,
					recipient: "",
					body: JSON.stringify(body.variables ?? {}),
					status: "queued" as const,
				}));
				const entries = await db.insert(commHistory).values(values).returning();
				return ok(entries);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			body: BatchSendBody,
			detail: { tags: ["Client Comms"], summary: "Batch send" },
		},
	)

	// ─── History ──────────────────────────────────────────────────
	.get(
		"/history",
		async ({ query, set }) => {
			try {
				const filters = [];
				if (query.channel) filters.push(eq(commHistory.channel, query.channel));
				if (query.status) filters.push(eq(commHistory.status, query.status));
				if (query.companyId)
					filters.push(eq(commHistory.companyId, query.companyId));
				if (query.from)
					filters.push(gte(commHistory.createdAt, new Date(query.from)));
				if (query.to)
					filters.push(lte(commHistory.createdAt, new Date(query.to)));

				const entries = await db
					.select()
					.from(commHistory)
					.where(and(...filters))
					.orderBy(desc(commHistory.createdAt))
					.limit(100);
				return ok(entries);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: t.Object({
				companyId: t.Optional(t.String({ format: "uuid" })),
				channel: t.Optional(t.String()),
				status: t.Optional(t.String()),
				from: t.Optional(t.String()),
				to: t.Optional(t.String()),
			}),
			detail: { tags: ["Client Comms"], summary: "List history" },
		},
	)

	.get(
		"/history/:id",
		async ({ params: { id }, set }) => {
			try {
				const [entry] = await db
					.select()
					.from(commHistory)
					.where(eq(commHistory.id, id))
					.limit(1);
				if (!entry) {
					set.status = 404;
					return fail("History entry not found", "NOT_FOUND");
				}
				return ok(entry);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{ detail: { tags: ["Client Comms"], summary: "Get history entry" } },
	)

	// ─── Automations ──────────────────────────────────────────────
	.post(
		"/automations",
		async ({ body, set }) => {
			try {
				const [automation] = await db
					.insert(commAutomations)
					.values(body)
					.returning();
				return ok(automation);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			body: CreateAutomationBody,
			detail: { tags: ["Client Comms"], summary: "Create automation" },
		},
	)

	.get(
		"/automations",
		async ({ query, set }) => {
			try {
				const filters = [];
				if (query.companyId)
					filters.push(eq(commAutomations.companyId, query.companyId));
				if (query.enabled !== undefined)
					filters.push(eq(commAutomations.enabled, query.enabled));

				const automations = await db
					.select()
					.from(commAutomations)
					.where(and(...filters))
					.orderBy(desc(commAutomations.createdAt));
				return ok(automations);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: t.Object({
				companyId: t.Optional(t.String({ format: "uuid" })),
				enabled: t.Optional(t.Boolean()),
			}),
			detail: { tags: ["Client Comms"], summary: "List automations" },
		},
	)

	.patch(
		"/automations/:id",
		async ({ params: { id }, body, set }) => {
			try {
				const [automation] = await db
					.update(commAutomations)
					.set({ ...body, updatedAt: new Date() })
					.where(eq(commAutomations.id, id))
					.returning();
				if (!automation) {
					set.status = 404;
					return fail("Automation not found", "NOT_FOUND");
				}
				return ok(automation);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			body: UpdateAutomationBody,
			detail: { tags: ["Client Comms"], summary: "Update automation" },
		},
	)

	.delete(
		"/automations/:id",
		async ({ params: { id }, set }) => {
			try {
				const [automation] = await db
					.delete(commAutomations)
					.where(eq(commAutomations.id, id))
					.returning();
				if (!automation) {
					set.status = 404;
					return fail("Automation not found", "NOT_FOUND");
				}
				return ok(automation);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{ detail: { tags: ["Client Comms"], summary: "Delete automation" } },
	)

	// ─── Dashboard ────────────────────────────────────────────────
	.get(
		"/dashboard",
		async ({ query, set }) => {
			try {
				const today = new Date();
				today.setHours(0, 0, 0, 0);

				const [
					[sentToday],
					[_deliveredCount],
					[failedCount],
					[activeAutomations],
				] = await Promise.all([
					db
						.select({ count: sql<number>`count(*)::int` })
						.from(commHistory)
						.where(
							and(
								eq(commHistory.companyId, query.companyId),
								gte(commHistory.createdAt, today),
							),
						),
					db
						.select({ count: sql<number>`count(*)::int` })
						.from(commHistory)
						.where(
							and(
								eq(commHistory.companyId, query.companyId),
								eq(commHistory.status, "delivered"),
							),
						),
					db
						.select({ count: sql<number>`count(*)::int` })
						.from(commHistory)
						.where(
							and(
								eq(commHistory.companyId, query.companyId),
								eq(commHistory.status, "failed"),
							),
						),
					db
						.select({ count: sql<number>`count(*)::int` })
						.from(commAutomations)
						.where(
							and(
								eq(commAutomations.companyId, query.companyId),
								eq(commAutomations.enabled, true),
							),
						),
				]);

				return ok({
					sentToday: sentToday?.count ?? 0,
					deliveredPercent: 0,
					failedCount: failedCount?.count ?? 0,
					activeAutomations: activeAutomations?.count ?? 0,
				});
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: t.Object({ companyId: t.String({ format: "uuid" }) }),
			detail: { tags: ["Client Comms"], summary: "Dashboard metrics" },
		},
	);

export default clientCommsRoutes;
