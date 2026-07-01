import { Elysia, t } from "elysia";
import { fail, getErrorMessage, ok } from "../../features/shared/api-response";
import { evidenceController } from "./evidence.controller";

export const evidenceRoutes = new Elysia({ prefix: "/api/v1/evidence" })
	.post(
		"/upload",
		async ({ body }) => {
			try {
				const result = await evidenceController.upload(body);
				return ok(result);
			} catch (error) {
				return fail("Failed to upload evidence", "EVIDENCE_UPLOAD_ERROR", {
					details: getErrorMessage(error),
				});
			}
		},
		{
			body: t.Object({
				organizationId: t.String({ format: "uuid" }),
				companyId: t.Optional(t.String({ format: "uuid" })),
				filename: t.String({ minLength: 1 }),
				mimeType: t.String({ minLength: 1 }),
				sizeBytes: t.Number(),
				hash: t.String({ minLength: 1 }),
				evidenceType: t.Union([
					t.Literal("INVOICE"),
					t.Literal("RECEIPT"),
					t.Literal("CONTRACT"),
					t.Literal("BANK_STATEMENT"),
					t.Literal("EMAIL"),
					t.Literal("OTHER"),
				]),
				source: t.Union([
					t.Literal("UPLOAD"),
					t.Literal("EMAIL"),
					t.Literal("API"),
					t.Literal("SYNC"),
				]),
				metadata: t.Optional(t.Record(t.String(), t.Unknown())),
				tags: t.Optional(t.Array(t.String())),
			}),
			detail: { tags: ["Evidence"], summary: "Register new evidence" },
		},
	)
	.get(
		"/list",
		async ({ query }) => {
			try {
				const result = await evidenceController.list(query);
				return ok(result);
			} catch (error) {
				return fail("Failed to list evidence", "EVIDENCE_LIST_ERROR", {
					details: getErrorMessage(error),
				});
			}
		},
		{
			query: t.Object({
				organizationId: t.String({ format: "uuid" }),
				status: t.Optional(
					t.Union([
						t.Literal("UPLOADED"),
						t.Literal("EXTRACTING"),
						t.Literal("CLASSIFIED"),
						t.Literal("VALIDATED"),
						t.Literal("REJECTED"),
						t.Literal("ERROR"),
					]),
				),
				evidenceType: t.Optional(
					t.Union([
						t.Literal("INVOICE"),
						t.Literal("RECEIPT"),
						t.Literal("CONTRACT"),
						t.Literal("BANK_STATEMENT"),
						t.Literal("EMAIL"),
						t.Literal("OTHER"),
					]),
				),
				source: t.Optional(
					t.Union([
						t.Literal("UPLOAD"),
						t.Literal("EMAIL"),
						t.Literal("API"),
						t.Literal("SYNC"),
					]),
				),
				dateFrom: t.Optional(t.String()),
				dateTo: t.Optional(t.String()),
				limit: t.Optional(t.Numeric()),
				offset: t.Optional(t.Numeric()),
			}),
			detail: { tags: ["Evidence"], summary: "List evidence with filters" },
		},
	)
	.get(
		"/:id",
		async ({ params, query, set }) => {
			try {
				const result = await evidenceController.getDetail(
					params.id,
					Number(query.organizationId),
				);
				if (!result) {
					set.status = 404;
					return fail("Evidence not found", "EVIDENCE_NOT_FOUND");
				}
				return ok(result);
			} catch (error) {
				return fail("Failed to get evidence", "EVIDENCE_GET_ERROR", {
					details: getErrorMessage(error),
				});
			}
		},
		{
			params: t.Object({ id: t.String({ format: "uuid" }) }),
			query: t.Object({
				organizationId: t.String({ format: "uuid" }),
			}),
			detail: {
				tags: ["Evidence"],
				summary: "Get evidence detail with timeline",
			},
		},
	)
	.patch(
		"/:id/classify",
		async ({ params, body, query, set }) => {
			try {
				const result = await evidenceController.classify(
					params.id,
					Number(query.organizationId),
					body,
				);
				if (!result) {
					set.status = 404;
					return fail("Evidence not found", "EVIDENCE_NOT_FOUND");
				}
				return ok(result);
			} catch (error) {
				return fail("Failed to classify evidence", "EVIDENCE_CLASSIFY_ERROR", {
					details: getErrorMessage(error),
				});
			}
		},
		{
			params: t.Object({ id: t.String({ format: "uuid" }) }),
			query: t.Object({
				organizationId: t.String({ format: "uuid" }),
			}),
			body: t.Object({
				evidenceType: t.Union([
					t.Literal("INVOICE"),
					t.Literal("RECEIPT"),
					t.Literal("CONTRACT"),
					t.Literal("BANK_STATEMENT"),
					t.Literal("EMAIL"),
					t.Literal("OTHER"),
				]),
				classification: t.Record(t.String(), t.Unknown()),
			}),
			detail: {
				tags: ["Evidence"],
				summary: "Update evidence classification",
			},
		},
	);
