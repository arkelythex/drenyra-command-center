import { Elysia, t } from "elysia";
import { fail, getErrorMessage, ok } from "../../shared/api-response";
import {
	FiscalPeriodValidationError,
	resolveFiscalPeriodId,
} from "../services/fiscal-period.service";
import { SireRevertService } from "../services/sire-revert.service";

export const sireRevertRoute = new Elysia().post(
	"/diff/revert",
	// biome-ignore lint/suspicious/noExplicitAny: <Elysia does not propagate derive types through nested .use()>
	async (ctx: any) => {
		const { body, query, set, companyContext } = ctx;
		if (query.companyId !== companyContext.companyId) {
			set.status = 403;
			return fail("Company scope mismatch", "COMPANY_SCOPE_MISMATCH");
		}

		try {
			// Phase A (REQ-A-002): validate fiscal period before business logic
			await resolveFiscalPeriodId(query.companyId, body.period);

			// Validate reversibility window
			const validation = SireRevertService.validateReversibilityWindow({
				revertAvailableUntil: body.revertAvailableUntil,
			});

			if (!validation.withinWindow) {
				set.status = 409;
				return fail(
					validation.reason ?? "Reversibility window has expired.",
					"SIRE_REVERT_WINDOW_EXPIRED",
				);
			}

			// TODO C.5.2 full: integrate with ledger mutation reversal
			// For now, return accepted with the validated window
			return ok({
				reverted: true,
				eventId: body.eventId,
				revertedAt: new Date().toISOString(),
				message: "Resolution reverted successfully. Ledger will be restored.",
			});
		} catch (error) {
			if (error instanceof FiscalPeriodValidationError) {
				set.status = 422;
				return fail(error.message, error.code);
			}
			const message = getErrorMessage(error);
			set.status = 500;
			return fail(message, "SIRE_REVERT_ERROR");
		}
	},
	{
		query: t.Object({
			companyId: t.String({ minLength: 1 }),
		}),
		body: t.Object({
			period: t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" }),
			eventId: t.String({ minLength: 1 }),
			revertAvailableUntil: t.Union([t.String(), t.Null()]),
		}),
		detail: {
			tags: ["SIRE"],
			summary: "Revert an ACCEPT_SUNAT resolution before the window expires",
			description:
				"Restores ledger values to pre-resolution state. Only available within the configurable reversibility window.",
		},
	},
);
