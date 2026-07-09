/**
 * ROI Engine — Elysia Routes
 *
 * POST /api/fiscal/roi/calculate
 * POST /api/fiscal/roi/payback
 * POST /api/fiscal/roi/npv
 * POST /api/fiscal/roi/irr
 * POST /api/fiscal/roi/scenario
 */

import { Elysia } from "elysia";
import { roiService } from "../application/services/roi.service";
import {
	IrrInput,
	NpvInput,
	PaybackInput,
	RoiCalculateInput,
	ScenarioCompareInput,
} from "../schemas";

export const roiRoutes = new Elysia({ prefix: "/api/fiscal/roi" })
	.post("/calculate", ({ body }) => roiService.calculate(body), {
		body: RoiCalculateInput,
	})
	.post("/payback", ({ body }) => roiService.payback(body), {
		body: PaybackInput,
	})
	.post("/npv", ({ body }) => roiService.npv(body), { body: NpvInput })
	.post("/irr", ({ body }) => roiService.irr(body), { body: IrrInput })
	.post("/scenario", ({ body }) => roiService.scenario(body), {
		body: ScenarioCompareInput,
	});
