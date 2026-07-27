/**
 * PLE Routes Assembly
 *
 * Mounts all PLE book routes under the reports module.
 */

import { Elysia } from "elysia";
import { pleDiarioRoute } from "./diario.routes";
import { pleMayorRoute } from "./mayor.routes";
import { pleComprasRoute } from "./compras.routes";
import { pleVentasRoute } from "./ventas.routes";
import { pleDownloadRoute } from "./download.routes";

/**
 * PLE sub-module with all 4 book generation endpoints + download.
 */
export const pleModule = new Elysia()
	.use(pleDiarioRoute)
	.use(pleMayorRoute)
	.use(pleComprasRoute)
	.use(pleVentasRoute)
	.use(pleDownloadRoute);
