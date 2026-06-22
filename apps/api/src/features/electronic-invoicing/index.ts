import { Elysia } from "elysia";
import { electronicInvoicingComplianceRoutes } from "./routes/compliance.routes";
import { electronicInvoicingLifecycleRoutes } from "./routes/lifecycle.routes";
import { electronicInvoicingOseReadinessRoute } from "./routes/ose-readiness.route";
import { electronicInvoicingSendRoutes } from "./routes/send.routes";

/**
 * electronicInvoicingModule const.
 *
 * @example
 * ```ts
 * console.log(electronicInvoicingModule);
 * ```
 */
export const electronicInvoicingModule = new Elysia({
	prefix: "/api/electronic-invoicing",
})
	.use(electronicInvoicingSendRoutes)
	.use(electronicInvoicingComplianceRoutes)
	.use(electronicInvoicingOseReadinessRoute)
	.use(electronicInvoicingLifecycleRoutes);
