/**
 * Legacy Reports Module
 *
 * Wraps v1 handlers at the legacy `/api/reports/*` prefix.
 * Injects deprecation headers: `Deprecation: true` + `Sunset: Sat, 01 Jan 2027 00:00:00 GMT`.
 * Maintained for backward compatibility until sunset.
 */

import { Elysia } from "elysia";
import { companyScopeGuard } from "../../../shared/plugins";
import { v1ReportsModule } from "../v1/routes";

export const legacyReportsModule = new Elysia({ prefix: "/api/reports" })
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.onAfterHandle({ as: "global" }, ({ set }) => {
		set.headers ??= {};
		(set.headers as Record<string, string>)["Deprecation"] = "true";
		(set.headers as Record<string, string>)["Sunset"] = "Sat, 01 Jan 2027 00:00:00 GMT";
	})
	// Delegate to v1 handlers (same logic, different prefix)
	.get("/profit-loss", async (ctx: any) => {
		const v1Ctx = { ...ctx, request: new Request(`http://localhost${ctx.request.url.replace("/api/reports", "/api/v1/reports")}`) };
		const result = await v1ReportsModule.handle(v1Ctx.request);
		return result;
	})
	.get("/balance-sheet", async (ctx: any) => {
		const v1Ctx = { ...ctx, request: new Request(`http://localhost${ctx.request.url.replace("/api/reports", "/api/v1/reports")}`) };
		const result = await v1ReportsModule.handle(v1Ctx.request);
		return result;
	})
	.get("/cash-flow", async (ctx: any) => {
		const v1Ctx = { ...ctx, request: new Request(`http://localhost${ctx.request.url.replace("/api/reports", "/api/v1/reports")}`) };
		const result = await v1ReportsModule.handle(v1Ctx.request);
		return result;
	})
	.get("/sales-by-customer", async (ctx: any) => {
		const v1Ctx = { ...ctx, request: new Request(`http://localhost${ctx.request.url.replace("/api/reports", "/api/v1/reports")}`) };
		const result = await v1ReportsModule.handle(v1Ctx.request);
		return result;
	});
