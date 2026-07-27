/**
 * Reports Routes Assembly
 *
 * Assembla los módulos legacy (/api/reports) y v1 (/api/v1/reports).
 * Punto de entrada único para app-core.ts.
 */

import { Elysia } from "elysia";
import { v1ReportsModule } from "./v1/routes";
import { legacyReportsModule } from "./legacy/routes";
import { pleModule } from "./v1/routes/ple";

export const reportsModule = new Elysia()
	.use(legacyReportsModule)
	.use(v1ReportsModule)
	.use(pleModule);
