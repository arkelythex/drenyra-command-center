import { Elysia } from "elysia";
import { createInvoiceRoute } from "./routes/create.route";
import { deleteInvoiceRoute } from "./routes/delete.route";
import { getInvoiceRoute } from "./routes/get.route";
import { listInvoicesRoute } from "./routes/list.route";
import { payInvoiceRoute } from "./routes/pay.route";
import { sendOseInvoiceRoute } from "./routes/send-ose.route";
import { updateInvoiceRoute } from "./routes/update.route";
import { updateInvoiceStatusRoute } from "./routes/update-status.route";

/**
 * Mounts all invoice API routes under a single prefix.
 *
 * @example
 * ```ts
 * app.use(invoiceRoutes);
 * ```
 */
export const invoiceRoutes = new Elysia({ prefix: "/api/invoices" })
	.use(createInvoiceRoute)
	.use(listInvoicesRoute)
	.use(getInvoiceRoute)
	.use(updateInvoiceRoute)
	.use(updateInvoiceStatusRoute)
	.use(deleteInvoiceRoute)
	.use(payInvoiceRoute)
	.use(sendOseInvoiceRoute);
