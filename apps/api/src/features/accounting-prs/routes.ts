import { Elysia, t } from "elysia";
import { companyScopeGuard } from "../../shared/plugins";
import { fail, getErrorMessage, ok } from "../shared/api-response";

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
// In-memory store (simple approach — replace with Postgres adapter later)
// ---------------------------------------------------------------------------

interface PrRecord {
	id: string;
	companyId: string;
	prNumber: number;
	title: string;
	description?: string;
	status: string;
	entries: string[];
	evidenceIds: string[];
	totalDebitCents: number;
	totalCreditCents: number;
	reviewerId?: string;
	reviewedAt?: string;
	reviewComment?: string;
	approveSignerIds: string[];
	approveSignatures: Array<{
		signerId: string;
		signedAt: string;
		comment?: string;
	}>;
	createdById?: string;
	createdAt: string;
	updatedAt: string;
}

const prStore: Map<string, PrRecord> = new Map();
const companyPrCounters: Map<string, number> = new Map();

function nextPrNumber(companyId: string): number {
	const next = (companyPrCounters.get(companyId) ?? 0) + 1;
	companyPrCounters.set(companyId, next);
	return next;
}

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

				// Build totals from entryIds (in real impl, fetch from DB)
				const totalDebitCents = 0;
				const totalCreditCents = 0;

				const now = new Date().toISOString();
				const record: PrRecord = {
					id: crypto.randomUUID(),
					companyId,
					prNumber: nextPrNumber(companyId),
					title: body.title,
					description: body.description,
					status: "DRAFT",
					entries: body.entryIds,
					evidenceIds: [],
					totalDebitCents,
					totalCreditCents,
					approveSignerIds: [],
					approveSignatures: [],
					createdById: companyContext.userId,
					createdAt: now,
					updatedAt: now,
				};

				prStore.set(record.id, record);
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

				const now = new Date().toISOString();
				const record: PrRecord = {
					id: crypto.randomUUID(),
					companyId,
					prNumber: nextPrNumber(companyId),
					title: body.title,
					description: body.description,
					status: "DRAFT",
					entries: body.entries,
					evidenceIds: body.evidenceIds ?? [],
					totalDebitCents: body.totalDebitCents,
					totalCreditCents: body.totalCreditCents,
					approveSignerIds: [],
					approveSignatures: [],
					createdById: companyContext.userId,
					createdAt: now,
					updatedAt: now,
				};

				prStore.set(record.id, record);
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

				let records = Array.from(prStore.values()).filter(
					(r) => r.companyId === companyId,
				);

				if (query.status) {
					records = records.filter((r) => r.status === query.status);
				}
				if (query.reviewerId) {
					records = records.filter((r) => r.reviewerId === query.reviewerId);
				}

				const limit = query.limit ? parseInt(query.limit, 10) : 50;
				const offset = query.offset ? parseInt(query.offset, 10) : 0;

				records.sort(
					(a, b) =>
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
				);

				return ok({
					data: records.slice(offset, offset + limit),
					total: records.length,
					limit,
					offset,
				});
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
		async ({ params, companyContext, set }) => {
			try {
				const record = prStore.get(params.id);
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
				const record = prStore.get(params.id);
				if (!record) {
					set.status = 404;
					return fail("PR no encontrada", "NOT_FOUND");
				}

				if (record.status !== "DRAFT") {
					set.status = 400;
					return fail(
						"Solo se pueden editar PRs en borrador",
						"VALIDATION_ERROR",
					);
				}

				const updated: PrRecord = {
					...record,
					...(body.title !== undefined && { title: body.title }),
					...(body.description !== undefined && {
						description: body.description,
					}),
					...(body.entries !== undefined && { entries: body.entries }),
					...(body.evidenceIds !== undefined && {
						evidenceIds: body.evidenceIds,
					}),
					...(body.totalDebitCents !== undefined && {
						totalDebitCents: body.totalDebitCents,
					}),
					...(body.totalCreditCents !== undefined && {
						totalCreditCents: body.totalCreditCents,
					}),
					updatedAt: new Date().toISOString(),
				};

				prStore.set(params.id, updated);
				return ok(updated);
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
				const record = prStore.get(params.id);
				if (!record) {
					set.status = 404;
					return fail("PR no encontrada", "NOT_FOUND");
				}

				if (record.status !== "DRAFT") {
					set.status = 400;
					return fail(
						"Solo se pueden enviar a revisión PRs en borrador",
						"VALIDATION_ERROR",
					);
				}

				const updated: PrRecord = {
					...record,
					status: "PENDING_REVIEW",
					updatedAt: new Date().toISOString(),
				};

				prStore.set(params.id, updated);
				return ok(updated);
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
				const record = prStore.get(params.id);
				if (!record) {
					set.status = 404;
					return fail("PR no encontrada", "NOT_FOUND");
				}

				if (record.status !== "PENDING_REVIEW") {
					set.status = 400;
					return fail(
						"Solo se pueden aprobar PRs en revisión",
						"VALIDATION_ERROR",
					);
				}

				const signerId = companyContext?.userId ?? "system";
				const signature = {
					signerId,
					signedAt: new Date().toISOString(),
					comment: body.comment,
				};

				const updated: PrRecord = {
					...record,
					status: "APPROVED",
					reviewedAt: new Date().toISOString(),
					reviewComment: body.comment ?? record.reviewComment,
					approveSignerIds: [
						...new Set([...record.approveSignerIds, signerId]),
					],
					approveSignatures: [...record.approveSignatures, signature],
					updatedAt: new Date().toISOString(),
				};

				prStore.set(params.id, updated);
				return ok(updated);
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
				const record = prStore.get(params.id);
				if (!record) {
					set.status = 404;
					return fail("PR no encontrada", "NOT_FOUND");
				}

				if (record.status !== "PENDING_REVIEW") {
					set.status = 400;
					return fail(
						"Solo se pueden rechazar PRs en revisión",
						"VALIDATION_ERROR",
					);
				}

				const updated: PrRecord = {
					...record,
					status: "REJECTED",
					reviewComment: body.reason,
					reviewedAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};

				prStore.set(params.id, updated);
				return ok(updated);
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
				const record = prStore.get(params.id);
				if (!record) {
					set.status = 404;
					return fail("PR no encontrada", "NOT_FOUND");
				}

				if (record.status !== "PENDING_REVIEW") {
					set.status = 400;
					return fail(
						"Solo se pueden firmar PRs en revisión",
						"VALIDATION_ERROR",
					);
				}

				const signature = {
					signerId: body.signerId,
					signedAt: new Date().toISOString(),
					comment: body.comment,
				};

				const updated: PrRecord = {
					...record,
					approveSignerIds: [
						...new Set([...record.approveSignerIds, body.signerId]),
					],
					approveSignatures: [...record.approveSignatures, signature],
					updatedAt: new Date().toISOString(),
				};

				prStore.set(params.id, updated);
				return ok(updated);
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
				const record = prStore.get(params.id);
				if (!record) {
					set.status = 404;
					return fail("PR no encontrada", "NOT_FOUND");
				}

				if (record.status !== "APPROVED") {
					set.status = 400;
					return fail(
						"Solo se pueden contabilizar PRs aprobadas",
						"VALIDATION_ERROR",
					);
				}

				const updated: PrRecord = {
					...record,
					status: "POSTED",
					updatedAt: new Date().toISOString(),
				};

				prStore.set(params.id, updated);
				return ok(updated);
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
