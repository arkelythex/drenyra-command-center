/**
 * ROI Engine — inferred types from Zod schemas
 */

import type { z } from "zod";
import type {
	IrrInput,
	NpvInput,
	PaybackInput,
	RoiCalculateInput,
	RoiRequest,
	RoiScenarioInput,
	ScenarioCompareInput,
} from "./schemas";

export type RoiCalculateInputType = z.infer<typeof RoiCalculateInput>;
export type PaybackInputType = z.infer<typeof PaybackInput>;
export type NpvInputType = z.infer<typeof NpvInput>;
export type IrrInputType = z.infer<typeof IrrInput>;
export type ScenarioCompareInputType = z.infer<typeof ScenarioCompareInput>;
export type RoiScenarioInputType = z.infer<typeof RoiScenarioInput>;
export type RoiRequestType = z.infer<typeof RoiRequest>;
