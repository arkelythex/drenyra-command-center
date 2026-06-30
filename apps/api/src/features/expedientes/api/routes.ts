import { Elysia, t } from "elysia";
import { companyScopeGuard } from "../../../shared/plugins";
import { resolveOrganizationId } from "../../journal-entries/application/_helpers";
import { fail, getErrorMessage, ok } from "../../shared/api-response";
import { expedienteService } from "../application/expediente.service";

function currentPeriod(): string {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export const expedienteRoutes = new Elysia({ prefix: "/api/expedientes" })
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.get(
		"/",
		async ({ query, companyContext, set }) => {
			try {
				const organizationId = await resolveOrganizationId(
					companyContext!.companyId,
				);
				const companyRuc =
					typeof query.companyRuc === "string" && query.companyRuc.trim()
						? query.companyRuc.trim()
						: ((companyContext as { companyRuc?: string }).companyRuc ?? "");

				if (!companyRuc) {
					set.status = 400;
					return fail("companyRuc is required", "COMPANY_RUC_REQUIRED");
				}

				const expedientes = await expedienteService.listExpedientes({
					companyId: companyContext!.companyId,
					companyRuc,
					organizationId,
					period: query.periodo,
					kind: query.kind,
				});

				return ok(expedientes);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "EXPEDIENTES_LIST_ERROR");
			}
		},
		{
			query: t.Object({
				companyRuc: t.Optional(t.String({ minLength: 11, maxLength: 11 })),
				periodo: t.Optional(t.String()),
				kind: t.Optional(
					t.Union([
						t.Literal("CIERRE_MENSUAL"),
						t.Literal("SIRE_COMPRAS"),
						t.Literal("SIRE_VENTAS"),
						t.Literal("CONCILIACION_BANCARIA"),
						t.Literal("AUDITORIA_FISCAL"),
						t.Literal("DECLARACION_JURADA"),
						t.Literal("DETRACCIONES"),
						t.Literal("PERCEPCIONES"),
						t.Literal("RETENCIONES"),
						t.Literal("GENERAL"),
					]),
				),
			}),
			detail: { tags: ["Expedientes"], summary: "List fiscal expedientes" },
		},
	)
	.get(
		"/:id",
		async ({ params, query, companyContext, set }) => {
			try {
				const organizationId = await resolveOrganizationId(
					companyContext!.companyId,
				);
				const companyRuc =
					typeof query.companyRuc === "string" && query.companyRuc.trim()
						? query.companyRuc.trim()
						: ((companyContext as { companyRuc?: string }).companyRuc ?? "");
				const periodo = query.periodo ?? currentPeriod();

				if (!companyRuc) {
					set.status = 400;
					return fail("companyRuc is required", "COMPANY_RUC_REQUIRED");
				}

				const scope = expedienteService.toScope({
					companyId: companyContext!.companyId,
					companyRuc,
					organizationId,
					period: periodo,
				});

				const expediente = await expedienteService.getExpediente(
					params.id,
					scope,
				);
				if (!expediente) {
					set.status = 404;
					return fail("Expediente no encontrado", "EXPEDIENTE_NOT_FOUND");
				}

				return ok(expediente);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "EXPEDIENTE_GET_ERROR");
			}
		},
		{
			params: t.Object({ id: t.String() }),
			query: t.Object({
				companyRuc: t.Optional(t.String({ minLength: 11, maxLength: 11 })),
				periodo: t.Optional(t.String()),
			}),
			detail: { tags: ["Expedientes"], summary: "Get expediente by ID" },
		},
	)
	.post(
		"/",
		async ({ body, companyContext, set }) => {
			try {
				const organizationId = await resolveOrganizationId(
					companyContext!.companyId,
				);
				const expediente = await expedienteService.createExpediente({
					companyId: companyContext!.companyId,
					companyRuc: body.companyRuc,
					organizationId,
					periodo: body.periodo,
					kind: body.kind,
					titulo: body.titulo,
					descripcion: body.descripcion,
				});
				set.status = 201;
				return ok(expediente);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "EXPEDIENTE_CREATE_ERROR");
			}
		},
		{
			body: t.Object({
				companyRuc: t.String({ minLength: 11, maxLength: 11 }),
				periodo: t.String(),
				kind: t.Union([
					t.Literal("CIERRE_MENSUAL"),
					t.Literal("SIRE_COMPRAS"),
					t.Literal("SIRE_VENTAS"),
					t.Literal("CONCILIACION_BANCARIA"),
					t.Literal("AUDITORIA_FISCAL"),
					t.Literal("DECLARACION_JURADA"),
					t.Literal("DETRACCIONES"),
					t.Literal("PERCEPCIONES"),
					t.Literal("RETENCIONES"),
					t.Literal("GENERAL"),
				]),
				titulo: t.String({ minLength: 1 }),
				descripcion: t.Optional(t.String()),
			}),
			detail: { tags: ["Expedientes"], summary: "Create fiscal expediente" },
		},
	)
	.patch(
		"/:id/status",
		async ({ params, body, companyContext, set }) => {
			try {
				const organizationId = await resolveOrganizationId(
					companyContext!.companyId,
				);
				const scope = expedienteService.toScope({
					companyId: companyContext!.companyId,
					companyRuc: body.companyRuc,
					organizationId,
					period: body.periodo,
				});

				const expediente = await expedienteService.updateExpedienteStatus({
					expedienteId: params.id,
					scope,
					status: body.status,
				});

				if (!expediente) {
					set.status = 404;
					return fail("Expediente no encontrado", "EXPEDIENTE_NOT_FOUND");
				}

				return ok(expediente);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "EXPEDIENTE_UPDATE_ERROR");
			}
		},
		{
			params: t.Object({ id: t.String() }),
			body: t.Object({
				companyRuc: t.String({ minLength: 11, maxLength: 11 }),
				periodo: t.String(),
				status: t.Union([
					t.Literal("ABIERTO"),
					t.Literal("EN_PROCESO"),
					t.Literal("PENDIENTE_REVISION"),
					t.Literal("PENDIENTE_APROBACION"),
					t.Literal("CERRADO"),
					t.Literal("ARCHIVADO"),
				]),
			}),
			detail: { tags: ["Expedientes"], summary: "Update expediente status" },
		},
	)
	.get(
		"/cierre-mensual/current",
		async ({ query, companyContext, set }) => {
			try {
				const organizationId = await resolveOrganizationId(
					companyContext!.companyId,
				);
				const companyRuc =
					typeof query.companyRuc === "string" && query.companyRuc.trim()
						? query.companyRuc.trim()
						: ((companyContext as { companyRuc?: string }).companyRuc ?? "");
				const periodo = query.periodo ?? currentPeriod();

				if (!companyRuc) {
					set.status = 400;
					return fail("companyRuc is required", "COMPANY_RUC_REQUIRED");
				}

				const cierre = await expedienteService.getOrCreateCierreMensual({
					companyId: companyContext!.companyId,
					companyRuc,
					organizationId,
					periodo,
				});

				return ok(cierre);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "CIERRE_GET_ERROR");
			}
		},
		{
			query: t.Object({
				companyRuc: t.Optional(t.String({ minLength: 11, maxLength: 11 })),
				periodo: t.Optional(t.String()),
			}),
			detail: {
				tags: ["Expedientes"],
				summary: "Get or create cierre mensual for period",
			},
		},
	)
	.patch(
		"/cierre-mensual/checklist/:itemId",
		async ({ params, body, companyContext, set }) => {
			try {
				const organizationId = await resolveOrganizationId(
					companyContext!.companyId,
				);
				const scope = expedienteService.toScope({
					companyId: companyContext!.companyId,
					companyRuc: body.companyRuc,
					organizationId,
					period: body.periodo,
				});

				const cierre = await expedienteService.updateCierreChecklist({
					scope,
					itemId: params.itemId,
					completado: body.completado,
				});

				if (!cierre) {
					set.status = 404;
					return fail("Cierre mensual no encontrado", "CIERRE_NOT_FOUND");
				}

				return ok(cierre);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "CIERRE_UPDATE_ERROR");
			}
		},
		{
			params: t.Object({ itemId: t.String() }),
			body: t.Object({
				companyRuc: t.String({ minLength: 11, maxLength: 11 }),
				periodo: t.String(),
				completado: t.Boolean(),
			}),
			detail: {
				tags: ["Expedientes"],
				summary: "Update cierre mensual checklist item",
			},
		},
	);

export default expedienteRoutes;
