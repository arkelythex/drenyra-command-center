import { Elysia } from "elysia";
import { companyScopeGuard } from "../../../shared/plugins";
import { fail, getErrorMessage, ok } from "../../shared/api-response";
import { resolveOrganizationId } from "../application/_helpers";
import {
	approveJournalEntryProposal,
	rejectJournalEntryProposal,
} from "../application/commands/approve-reject-proposal";
import { createJournalEntry } from "../application/commands/create-journal-entry";
import { deleteJournalEntry } from "../application/commands/delete-journal-entry";
import { updateJournalEntry } from "../application/commands/update-journal-entry";
import { updateJournalEntryStatus } from "../application/commands/update-status";
import { getJournalEntry } from "../application/queries/get-journal-entry";
import { listJournalEntries } from "../application/queries/list-journal-entries";
import {
	CreateJournalEntryBody,
	JournalEntryParams,
	ListJournalEntriesQuery,
	UpdateJournalEntryBody,
} from "./schemas";

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export const journalEntryRoutes = new Elysia({
	prefix: "/api/journal-entries",
	name: "journal-entries",
})
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	// ---- LIST ----
	.get(
		"/",
		async ({ query, companyContext, set }) => {
			try {
				const organizationId = await resolveOrganizationId(
					companyContext?.companyId,
				);
				const entries = await listJournalEntries({
					organizationId,
					status:
						(query.status as
							| "borrador"
							| "mayorizado"
							| "declarado"
							| "all"
							| undefined) ?? "all",
					...(query.dateFrom ? { dateFrom: new Date(query.dateFrom) } : {}),
					...(query.dateTo ? { dateTo: new Date(query.dateTo) } : {}),
					...(query.documentNumber !== undefined
						? { documentNumber: query.documentNumber }
						: {}),
				});

				return ok(entries);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: ListJournalEntriesQuery,
			detail: {
				tags: ["Journal Entries"],
				summary: "Listar asientos contables",
			},
		},
	)
	// ---- CREATE ----
	.post(
		"/",
		async ({ body, companyContext, set }) => {
			try {
				const organizationId = await resolveOrganizationId(
					companyContext?.companyId,
				);

				const entry = await createJournalEntry({
					organizationId,
					date: new Date(body.date),
					gloss: body.gloss,
					lines: body.lines.map((line) => ({
						accountId: line.accountId,
						description: line.description,
						debit: line.debit,
						credit: line.credit,
						...(line.documentType !== undefined
							? { documentType: line.documentType }
							: {}),
						...(line.documentNumber !== undefined
							? { documentNumber: line.documentNumber }
							: {}),
						...(line.dueDate ? { dueDate: new Date(line.dueDate) } : {}),
					})),
				});

				set.status = 201;
				return ok(entry);
			} catch (error) {
				const message = getErrorMessage(error);
				if (
					message.includes("no encontrada") ||
					message.includes("balanceado") ||
					message.includes("requerida")
				) {
					set.status = 400;
					return fail(message, "VALIDATION_ERROR");
				}
				set.status = 500;
				return fail(message, "INTERNAL_ERROR");
			}
		},
		{
			body: CreateJournalEntryBody,
			detail: {
				tags: ["Journal Entries"],
				summary: "Crear asiento contable",
			},
		},
	)
	// ---- GET BY ID ----
	.get(
		"/:id",
		async ({ params, set }) => {
			try {
				const entry = await getJournalEntry({ id: params.id });
				if (!entry) {
					set.status = 404;
					return fail("Asiento no encontrado", "NOT_FOUND");
				}

				return ok(entry);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			params: JournalEntryParams,
			detail: {
				tags: ["Journal Entries"],
				summary: "Obtener asiento por ID",
			},
		},
	)
	// ---- UPDATE ----
	.patch(
		"/:id",
		async ({ params, body, set }) => {
			try {
				const entry = await updateJournalEntry(params.id, {
					...(body.date ? { date: new Date(body.date) } : {}),
					...(body.gloss !== undefined ? { gloss: body.gloss } : {}),
					...(body.lines
						? {
								lines: body.lines.map((line) => ({
									accountId: line.accountId,
									description: line.description,
									debit: line.debit,
									credit: line.credit,
									...(line.documentType !== undefined
										? { documentType: line.documentType }
										: {}),
									...(line.documentNumber !== undefined
										? { documentNumber: line.documentNumber }
										: {}),
									...(line.dueDate ? { dueDate: new Date(line.dueDate) } : {}),
								})),
						  }
						: {}),
				});

				return ok(entry);
			} catch (error) {
				const message = getErrorMessage(error);
				if (message.includes("Solo se pueden editar")) {
					set.status = 400;
					return fail(message, "VALIDATION_ERROR");
				}
				set.status = 500;
				return fail(message, "INTERNAL_ERROR");
			}
		},
		{
			params: JournalEntryParams,
			body: UpdateJournalEntryBody,
			detail: {
				tags: ["Journal Entries"],
				summary: "Actualizar asiento contable",
			},
		},
	)
	// ---- DELETE ----
	.delete(
		"/:id",
		async ({ params, set }) => {
			try {
				await deleteJournalEntry(params.id);

				return ok({ deleted: true });
			} catch (error) {
				const message = getErrorMessage(error);
				if (message.includes("Solo se pueden eliminar")) {
					set.status = 400;
					return fail(message, "VALIDATION_ERROR");
				}
				set.status = 500;
				return fail(message, "INTERNAL_ERROR");
			}
		},
		{
			params: JournalEntryParams,
			detail: {
				tags: ["Journal Entries"],
				summary: "Eliminar asiento contable",
			},
		},
	)
	// ---- MAYORIZAR (post) ----
	.post(
		"/:id/mayorizar",
		async ({ params, set }) => {
			try {
				const entry = await updateJournalEntryStatus(
					params.id,
					"mayorizado",
					"system",
				);

				return ok(entry);
			} catch (error) {
				const message = getErrorMessage(error);
				if (message.includes("Solo se pueden mayorizar")) {
					set.status = 400;
					return fail(message, "VALIDATION_ERROR");
				}
				set.status = 500;
				return fail(message, "INTERNAL_ERROR");
			}
		},
		{
			params: JournalEntryParams,
			detail: {
				tags: ["Journal Entries"],
				summary: "Mayorizar asiento (borrador → mayorizado)",
			},
		},
	)
	// ---- DECLARAR ----
	.post(
		"/:id/declarar",
		async ({ params, set }) => {
			try {
				const entry = await updateJournalEntryStatus(
					params.id,
					"declarado",
					"system",
				);

				return ok(entry);
			} catch (error) {
				const message = getErrorMessage(error);
				if (message.includes("Solo se pueden declarar")) {
					set.status = 400;
					return fail(message, "VALIDATION_ERROR");
				}
				set.status = 500;
				return fail(message, "INTERNAL_ERROR");
			}
		},
		{
			params: JournalEntryParams,
			detail: {
				tags: ["Journal Entries"],
				summary: "Declarar asiento (mayorizado → declarado)",
			},
		},
	)
	// ---- APPROVE PROPOSAL (PR flow) ----
	.post(
		"/:id/approve",
		async ({ params, companyContext, set }) => {
			try {
				const entry = await approveJournalEntryProposal(
					params.id,
					companyContext?.userId ?? "system",
				);
				return ok(entry);
			} catch (error) {
				const message = getErrorMessage(error);
				if (
					message.includes("Solo se pueden mayorizar") ||
					message.includes("no encontrado")
				) {
					set.status = 400;
					return fail(message, "VALIDATION_ERROR");
				}
				set.status = 500;
				return fail(message, "INTERNAL_ERROR");
			}
		},
		{
			params: JournalEntryParams,
			detail: {
				tags: ["Journal Entries"],
				summary: "Approve ledger PR proposal and post (mayorizar)",
			},
		},
	)
	// ---- REJECT PROPOSAL (PR flow) ----
	.post(
		"/:id/reject",
		async ({ params, companyContext, set }) => {
			try {
				const result = await rejectJournalEntryProposal(
					params.id,
					companyContext?.userId ?? "system",
				);
				return ok(result);
			} catch (error) {
				const message = getErrorMessage(error);
				if (
					message.includes("Solo se pueden rechazar") ||
					message.includes("no encontrado")
				) {
					set.status = 400;
					return fail(message, "VALIDATION_ERROR");
				}
				set.status = 500;
				return fail(message, "INTERNAL_ERROR");
			}
		},
		{
			params: JournalEntryParams,
			detail: {
				tags: ["Journal Entries"],
				summary: "Reject ledger PR proposal",
			},
		},
	);
