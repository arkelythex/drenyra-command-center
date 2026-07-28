import { Elysia, t } from "elysia";
import { fail, getErrorMessage, ok } from "../../shared/api-response";
import { SireDiffService } from "../services/sire-diff.service";
import {
	FiscalPeriodValidationError,
	resolveFiscalPeriodId,
} from "../services/fiscal-period.service";

export const sireDiffRoute = new Elysia().post(
	"/diff",
	async ({ body, query, set }) => {
		try {
			// Phase A (REQ-A-002): validate fiscal period before business logic
			await resolveFiscalPeriodId(query.companyId, query.period);

			const artifact = await SireDiffService.buildThreeWayDiff({
				companyId: query.companyId,
				period: query.period,
				sireFile: body.sireFile,
				cpeFile: body.cpeFile,
			});
			return ok(artifact);
		} catch (error) {
			if (error instanceof FiscalPeriodValidationError) {
				set.status = 422;
				return fail(error.message, error.code);
			}
			set.status = 500;
			return fail(getErrorMessage(error), "SIRE_DIFF_ERROR");
		}
	},
	{
		query: t.Object({
			companyId: t.String({ minLength: 1 }),
			period: t.String({ pattern: "^\\d{4}-(0[1-9]|1[0-2])$" }),
		}),
		body: t.Object({
			sireFile: t.Optional(t.File()),
			cpeFile: t.Optional(t.File()),
		}),
		detail: {
			tags: ["SIRE"],
			summary: "Three-way SIRE diff (SUNAT vs ledger vs CPE)",
			description:
				"Builds diff artifact for accountant review. submitBlocked when SUNAT rows unavailable or critical discrepancies remain.",
		},
	},
);
