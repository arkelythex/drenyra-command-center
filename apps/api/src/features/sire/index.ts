import { Elysia } from "elysia";
import { companyScopeGuard } from "../../shared/plugins/company-scope-guard";
import { enforceSireRateLimit } from "./middleware/rate-limit.middleware";
import { enforceSireAuth } from "./middleware/sire-auth.middleware";
import { analyzeSireRoute } from "./routes/analyze.route";
import { sireDiffRoute } from "./routes/diff.route";
import { sireDiffCommitRoute } from "./routes/diff-commit.route";
import { sireReportingRoutes } from "./routes/reporting.route";
import { submitSireRoute } from "./routes/submit.route";

/**
 * SIRE Elysia module (Sistema Integrado de Registros Electrónicos).
 *
 * Provides endpoints for SUNAT electronic bookkeeping compliance. All routes
 * are mounted under the `/sire` prefix.
 *
 * **SUNAT Compliance:**
 * - Monthly submission required by day 10 of following month
 * - Formats: Registro de Ventas (sales), Registro de Compras (purchases)
 * - File formats: TXT (pipe-delimited), Excel, XML (UBL 2.1)
 * - Validation: RUC (Módulo 11), period format (YYYYMM00), monetary amounts
 *
 * **Available Routes:**
 * - `POST /sire/analyze` - Upload and analyze SIRE file
 * - `POST /sire/submit` - Submit SIRE payload to SUNAT API (or simulation fallback)
 * - `GET /sire/conciliation` - Reconcile SIRE period against ledger evidence
 * - `GET /sire/dashboard` - SIRE operational dashboard for deadline/compliance
 *
 * **Authentication:**
 * - Requires HS256 bearer JWT with `companyId`/`organizationId` claim
 * - Request `companyId` must match JWT claim (and `X-Company-Id` when provided)
 *
 * **Rate Limits:**
 * - Max 10 requests per minute per company on each SIRE route
 *
 * @example
 * ```ts
 * import { Elysia } from "elysia";
 * import { sireModule } from "./features/sire";
 *
 * // Mount SIRE module
 * const app = new Elysia()
 *   .use(sireModule)
 *   .listen(3000);
 *
 * // Routes available:
 * // POST /sire/analyze?companyId=xxx (body: multipart/form-data)
 * // POST /sire/submit (body: JSON)
 * // GET /sire/conciliation?companyId=xxx&period=YYYY-MM
 * // GET /sire/dashboard?companyId=xxx&period=YYYY-MM
 * ```
 *
 * @see {@link SireService} Application service layer
 * @see {@link https://www.sunat.gob.pe/legislacion/superin/2013/271-2013.pdf} SUNAT Resolution 271-2013
 */
/** Minimal context shape accepted by both SIRE middleware functions */
type SireMiddlewareContext = {
	body: unknown;
	query: unknown;
	request: Request;
	set: { status: number; headers: Record<string, string> };
};
/**
 * SIRE Elysia module — exposes all SIRE endpoints under `/sire`.
 * Applies auth and rate-limit middleware on every request.
 *
 * @example
 * ```ts
 * app.use(sireModule);
 * ```
 */
export const sireModule = new Elysia({ prefix: "/api/sire" })
	.use(companyScopeGuard())
	.onBeforeHandle((context) => {
		return enforceSireAuth(context as unknown as SireMiddlewareContext);
	})
	.onBeforeHandle((context) => {
		return enforceSireRateLimit(context as unknown as SireMiddlewareContext);
	})
	.use(analyzeSireRoute)
	.use(sireDiffRoute)
	.use(sireDiffCommitRoute)
	.use(submitSireRoute)
	.use(sireReportingRoutes);
