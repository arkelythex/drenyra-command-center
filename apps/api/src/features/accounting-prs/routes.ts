import { Elysia, t } from "elysia";
import { companyScopeGuard } from "../../shared/plugins";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import { audit } from "../shared/audit-log";
import { accountingPrController } from "./controller";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const CreatePrBody = t.Object({
	title: t.String({ minLength: 1 }),
	description: t.Optional(t.String()),
	entries: t.Array(t.String()),
	evidenceIds: t.Optional(t.Array(t.String())),
	totalDebitCents: t.Number(),
	totalCreditCents: t.Number(),
});

const UpdatePrBody = t.Object({
	title: t.Optional(t.String({ minLength: 1 })),
	description: t.Optional(t.String()),
	entries: t.Optional(t.Array(t.String())),
	evidenceIds: t.Optional(t.Array(t.String())),
	totalDebitCents: t.Optional(t.Number()),
	totalCreditCents: t.Optional(t.Number()),
});

const PrParams = t.Object({
	id: t.String({ minLength: 1 }),
});

const ListPrQuery = t.Object({
	status: t.Optional(t.String()),
	reviewerId: t.Optional(t.String()),
	limit: t.Optional(t.String()),
	offset: t.Optional(t.String()),
});

const ApproveBody = t.Object({
	comment: t.Optional(t.String()),
});

const RejectBody = t.Object({
	reason: t.String({ minLength: 1 }),
});

const MultiSignBody = t.Object({
	signerId: t.String({ minLength: 1 }),
	comment: t.Optional(t.String()),
});

const FromEntriesBody = t.Object({
	title: t.String({ minLength: 1 }),
	description: t.Optional(t.String()),
	entryIds: t.Array(t.String({ minLength: 1 }), { minItems: 1 }),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export const accountingPrRoutes = new Elysia({
	prefix: "/api/v1/accounting-prs",
	name: "accounting-prs",
})
	.use(companyScopeGuard({ allowHeaderFallback: true }))

	// ---- CREATE FROM ENTRIES ----
	.post(
		"/from-entries",
		async ({ body, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}

				const record = await accountingPrController.createFromEntries(
					companyId,
					companyContext.userId,
					body,
				);

				set.status = 201;
				return ok(record);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			body: FromEntriesBody,
			detail: {
				tags: ["Accounting PRs"],
				summary: "Crear PR desde asientos contables seleccionados",
			},
		},
	)

	// ---- CREATE ----
	.post(
		"/",
		async ({ body, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}

				const record = await accountingPrController.create(
					companyId,
					companyContext.userId,
					body,
				);

				set.status = 201;
				return ok(record);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			body: CreatePrBody,
			detail: {
				tags: ["Accounting PRs"],
				summary: "Crear pull request contable",
			},
		},
	)

	// ---- LIST ----
	.get(
		"/",
		async ({ query, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}

				const result = await accountingPrController.list(companyId, query);
				return ok(result);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: ListPrQuery,
			detail: {
				tags: ["Accounting PRs"],
				summary: "Listar pull requests contables",
			},
		},
	)

	// ---- GET BY ID ----
	.get(
		"/:id",
		async ({ params, set }) => {
			try {
				const record = await accountingPrController.getById(params.id);
				if (!record) {
					set.status = 404;
					return fail("PR no encontrada", "NOT_FOUND");
				}

				return ok(record);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: PrParams,
			detail: {
				tags: ["Accounting PRs"],
				summary: "Obtener PR por ID",
			},
		},
	)

	// ---- UPDATE ----
	.patch(
		"/:id",
		async ({ params, body, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}

				try {
					const record = await accountingPrController.update(
						params.id,
						companyId,
						body,
					);
					if (!record) {
						set.status = 404;
						return fail("PR no encontrada", "NOT_FOUND");
					}
					return ok(record);
				} catch (err) {
					if (
						err instanceof Error &&
						err.message.includes("Solo se pueden editar")
					) {
						set.status = 400;
						return fail(err.message, "VALIDATION_ERROR");
					}
					throw err;
				}
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: PrParams,
			body: UpdatePrBody,
			detail: {
				tags: ["Accounting PRs"],
				summary: "Actualizar PR (solo en borrador)",
			},
		},
	)

	// ---- SUBMIT FOR REVIEW ----
	.patch(
		"/:id/submit",
		async ({ params, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}

				const record = await accountingPrController.submit(
					params.id,
					companyId,
				);
				if (!record) {
					set.status = 404;
					return fail("PR no encontrada", "NOT_FOUND");
				}
				audit.log({
					companyId,
					feature: "accounting-prs",
					action: "submit",
					targetId: params.id,
					actorId: companyContext?.userId ?? "system",
					previousValue: "DRAFT",
					newValue: "PENDING_REVIEW",
				});
				return ok(record);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: PrParams,
			detail: {
				tags: ["Accounting PRs"],
				summary: "Enviar a revisión (DRAFT → PENDING_REVIEW)",
			},
		},
	)

	// ---- APPROVE ----
	.patch(
		"/:id/approve",
		async ({ params, body, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}

				const signerId = companyContext?.userId ?? "system";

				try {
					const record = await accountingPrController.approve(
						params.id,
						companyId,
						signerId,
						body.comment,
					);
					if (!record) {
						set.status = 404;
						return fail("PR no encontrada", "NOT_FOUND");
					}
					audit.log({
						companyId,
						feature: "accounting-prs",
						action: "approve",
						targetId: params.id,
						actorId: companyContext?.userId ?? "system",
						previousValue: "PENDING_REVIEW",
						newValue: "APPROVED",
					});
					return ok(record);
				} catch (err) {
					if (
						err instanceof Error &&
						err.message.includes("Solo se pueden aprobar")
					) {
						set.status = 400;
						return fail(err.message, "VALIDATION_ERROR");
					}
					throw err;
				}
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: PrParams,
			body: ApproveBody,
			detail: {
				tags: ["Accounting PRs"],
				summary: "Aprobar PR (PENDING_REVIEW → APPROVED)",
			},
		},
	)

	// ---- REJECT ----
	.patch(
		"/:id/reject",
		async ({ params, body, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}

				const record = await accountingPrController.reject(
					params.id,
					companyId,
					body.reason,
				);
				if (!record) {
					set.status = 404;
					return fail("PR no encontrada", "NOT_FOUND");
				}
				audit.log({
					companyId,
					feature: "accounting-prs",
					action: "reject",
					targetId: params.id,
					actorId: companyContext?.userId ?? "system",
					previousValue: "PENDING_REVIEW",
					newValue: "REJECTED",
					metadata: JSON.stringify({ reason: body.reason }),
				});
				return ok(record);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: PrParams,
			body: RejectBody,
			detail: {
				tags: ["Accounting PRs"],
				summary: "Rechazar PR (PENDING_REVIEW → REJECTED)",
			},
		},
	)

	// ---- MULTI-SIGNER APPROVE ----
	.patch(
		"/:id/approve-multi",
		async ({ params, body, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}

				try {
					const record = await accountingPrController.addSignature(
						params.id,
						companyId,
						body.signerId,
						body.comment,
					);
					if (!record) {
						set.status = 404;
						return fail("PR no encontrada", "NOT_FOUND");
					}
					return ok(record);
				} catch (err) {
					if (
						err instanceof Error &&
						err.message.includes("Solo se pueden firmar")
					) {
						set.status = 400;
						return fail(err.message, "VALIDATION_ERROR");
					}
					throw err;
				}
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: PrParams,
			body: MultiSignBody,
			detail: {
				tags: ["Accounting PRs"],
				summary: "Agregar firma multi-signatario a PR en revisión",
			},
		},
	)

	// ---- POST ----
	.patch(
		"/:id/post",
		async ({ params, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}

				const record = await accountingPrController.post(params.id, companyId);
				if (!record) {
					set.status = 404;
					return fail("PR no encontrada", "NOT_FOUND");
				}
				audit.log({
					companyId,
					feature: "accounting-prs",
					action: "post",
					targetId: params.id,
					actorId: companyContext?.userId ?? "system",
					previousValue: "APPROVED",
					newValue: "POSTED",
				});
				return ok(record);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: PrParams,
			detail: {
				tags: ["Accounting PRs"],
				summary: "Contabilizar PR aprobada (APPROVED → POSTED)",
			},
		},
	);
