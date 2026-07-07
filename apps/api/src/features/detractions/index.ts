import { Elysia } from "elysia";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import { listDetractions } from "./application/queries/list-detractions.query";
import { ListDetractionsQuerySchema } from "./detractions.schemas";
import { companyScopeGuard } from "../../shared/plugins";

/**
 * Detractions feature module.
 *
 * Provides a lightweight list endpoint for the `detractions` table,
 * ordered by `createdAt` descending with a limit of 100 rows.
 *
 * @example
 * ```ts
 * const app = new Elysia().use(detractionsModule);
 * // GET /api/detractions?companyId=<uuid>
 * ```
 */
export const detractionsModule = new Elysia({ prefix: "/api/detractions" })
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.get(
		"/",
		async ({ query, set }) => {
			try {
				const parsed = ListDetractionsQuerySchema.safeParse(query);
				if (!parsed.success) {
					set.status = 400;
					return fail("Invalid query parameters", "VALIDATION_ERROR");
				}

				const result = await listDetractions({
					companyId: parsed.data.companyId,
					status: parsed.data.status,
				});

				return ok(result);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: ListDetractionsQuerySchema,
			detail: {
				tags: ["Compliance", "Detractions"],
				summary: "List detractions",
				description:
					"Returns up to 100 detraction rows, ordered by createdAt descending. Filters by companyId or status are optional.",
			},
		},
	);

export default detractionsModule;
