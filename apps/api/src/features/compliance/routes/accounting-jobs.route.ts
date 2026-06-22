import { Elysia } from "elysia";
import { z } from "zod";
import { getAccountingJobs } from "../../../lib/accounting-jobs";
import {
	type CountryCode,
	DEFAULT_COUNTRY_CODE,
	isCountryCode,
} from "../../../lib/latam-country-packs";
import { fail, ok } from "../../shared/api-response";

/**
 * accountingJobsRoute const.
 *
 * @example
 * ```ts
 * console.log(accountingJobsRoute);
 * ```
 */
export const accountingJobsRoute = new Elysia()
	.get(
		"/accounting-jobs",
		({ query }) => {
			const countryCode = (
				query.countryCode && isCountryCode(query.countryCode)
					? query.countryCode
					: DEFAULT_COUNTRY_CODE
			) as CountryCode;

			return ok({
				countryCode,
				jobs: getAccountingJobs(countryCode),
			});
		},
		{
			query: z.object({
				countryCode: z.string().min(2).max(2).optional(),
			}),
			detail: {
				tags: ["Compliance", "Localization", "Assistant"],
				summary: "List accounting jobs for one country",
				description:
					"Devuelve el catálogo base de trabajos persistentes del asistente por país.",
			},
		},
	)
	.get(
		"/accounting-jobs/:countryCode",
		({ params, set }) => {
			if (!isCountryCode(params.countryCode)) {
				set.status = 404;
				return fail(
					"Accounting jobs not supported for this country",
					"ACCOUNTING_JOBS_NOT_SUPPORTED",
				);
			}

			return ok({
				countryCode: params.countryCode,
				jobs: getAccountingJobs(params.countryCode),
			});
		},
		{
			params: z.object({
				countryCode: z.string().min(2).max(2),
			}),
			detail: {
				tags: ["Compliance", "Localization", "Assistant"],
				summary: "Get accounting jobs for one country",
			},
		},
	);
