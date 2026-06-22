import { Elysia } from "elysia";
import { aiToolPermissionsModule } from "./features/ai-tool-permissions";
import { analyticsModule } from "./features/analytics";
import { complianceModule } from "./features/compliance";
import { contextModule } from "./features/context";
import { cpeValidatorRoutes } from "./features/cpe-validator";
import { documentsModule } from "./features/documents";
import { electronicInvoicingModule } from "./features/electronic-invoicing";
import { governanceAuditModule } from "./features/governance-audit";
import { inboxModule } from "./features/inbox";
import { intelligenceModule } from "./features/intelligence/api/routes";
import { roiRoutes } from "./features/roi/api/routes";
import { interCompanyRoutes } from "./features/inter-company";
import { inventoryModule } from "./features/inventory";
import { ledgerModule } from "./features/ledger";
import { productsModule } from "./features/products";
import { reconciliationsModule } from "./features/reconciliations";
import { reportsModule } from "./features/reports";
import { sireModule } from "./features/sire";
import { taxationModule } from "./features/taxation";
import { transactionsRoutes } from "./features/transactions";

/**
 * Single unified API module surface.
 *
 * All feature modules are registered ONCE, each with their own `/api/` prefix.
 * The previous dual registration (`apiRootModules` + `apiCanonicalModules`)
 * has been collapsed into this single manifest.
 *
 * Each feature module's prefix has been updated from bare (e.g. `/products`)
 * to `/api/...` (e.g. `/api/products`), eliminating the need for an outer
 * group prefix or a duplicate mount.
 */
export const apiModules = new Elysia({ name: "api-modules" })
	.use(analyticsModule)
	.use(complianceModule)
	.use(contextModule)
	.use(cpeValidatorRoutes)
	.use(documentsModule)
	.use(electronicInvoicingModule)
	.use(governanceAuditModule)
	.use(inboxModule)
	.use(inventoryModule)
	.use(interCompanyRoutes)
	.use(ledgerModule)
	.use(aiToolPermissionsModule)
	.use(productsModule)
	.use(reconciliationsModule)
	.use(reportsModule)
	.use(sireModule)
	.use(taxationModule)
	.use(transactionsRoutes)
	.use(intelligenceModule)
	.use(roiRoutes);

/**
 * Backward-compatible 308 redirects for features whose paths changed from
 * bare (e.g. `/products`) to `/api/...` (e.g. `/api/products`).
 *
 * Uses Elysia prefix groups with wildcard `*` to catch sub-paths
 * (e.g. `/products/123` → `/api/products/123`).
 *
 * Each redirect includes a `Deprecation: true` header to signal that the
 * old path is deprecated and will be removed in a future release.
 *
 * Exceptions:
 * - `healthModule` stays at `/health` (public health check, documented exception)
 */
/**
 * Redirect target for an old bare path → new /api/ path.
 */
interface DeprecationRule {
	oldPrefix: string; // e.g. "/products"
	newPrefix: string; // e.g. "/api/products"
}

/**
 * All features whose path changed from bare to /api/.
 * healthModule is excluded (public health check, documented exception).
 */
const DEPRECATION_RULES: DeprecationRule[] = [
	{ oldPrefix: "/products", newPrefix: "/api/products" },
	{ oldPrefix: "/ai-tool-permissions", newPrefix: "/api/ai-tool-permissions" },
	{ oldPrefix: "/analytics", newPrefix: "/api/analytics" },
	{ oldPrefix: "/compliance", newPrefix: "/api/compliance" },
	{ oldPrefix: "/context", newPrefix: "/api/context" },
	{ oldPrefix: "/cpe-validator", newPrefix: "/api/cpe-validator" },
	{ oldPrefix: "/documents", newPrefix: "/api/documents" },
	{
		oldPrefix: "/electronic-invoicing",
		newPrefix: "/api/electronic-invoicing",
	},
	{ oldPrefix: "/governance-audit", newPrefix: "/api/governance-audit" },
	{ oldPrefix: "/inbox", newPrefix: "/api/inbox" },
	{ oldPrefix: "/inventory", newPrefix: "/api/inventory" },
	{ oldPrefix: "/inter-company", newPrefix: "/api/inter-company" },
	{ oldPrefix: "/ledger", newPrefix: "/api/ledger" },
	{ oldPrefix: "/ledger-mvp", newPrefix: "/api/ledger-mvp" },
	{ oldPrefix: "/reconciliations", newPrefix: "/api/reconciliations" },
	{ oldPrefix: "/reports", newPrefix: "/api/reports" },
	{ oldPrefix: "/sire", newPrefix: "/api/sire" },
	{ oldPrefix: "/taxation", newPrefix: "/api/taxation" },
	{ oldPrefix: "/transactions", newPrefix: "/api/transactions" },
];

/**
 * Backward-compatible 308 redirects for features whose paths changed from
 * bare (e.g. `/products`) to `/api/...` (e.g. `/api/products`).
 *
 * Uses Elysia `:subpath*` catch-all to handle any sub-path depth
 * (e.g. `/products/123` → `/api/products/123`).
 *
 * Each redirect includes a `Deprecation: true` header to signal that the
 * old path is deprecated and will be removed in a future release.
 */
export const backwardCompatRedirects = new Elysia({
	name: "backward-compat-redirects",
});

for (const rule of DEPRECATION_RULES) {
	// Exact root match: /products → /api/products
	backwardCompatRedirects.all(rule.oldPrefix, ({ set }) => {
		set.headers["Deprecation"] = "true";
		return new Response(null, {
			status: 308,
			headers: { Location: rule.newPrefix, Deprecation: "true" },
		});
	});
	// Sub-path match: /products/* → /api/products/*
	backwardCompatRedirects.all(`${rule.oldPrefix}/*`, ({ params, set }) => {
		set.headers["Deprecation"] = "true";
		const rest = (params as Record<string, string>)["*"];
		const location = rest ? `${rule.newPrefix}/${rest}` : rule.newPrefix;
		return new Response(null, {
			status: 308,
			headers: { Location: location, Deprecation: "true" },
		});
	});
}
