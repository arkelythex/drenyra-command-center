/**
 * Compliance API — sub-module barrel
 *
 * Composes the top-level `complianceApi` object from domain sub-modules.
 */

import { accountingJobsApi } from "./accounting-jobs.api";
import { cpeValidatorApi } from "./cpe-validator.api";
import { roadmapApi } from "./roadmap.api";
import { sireApi } from "./sire.api";

/**
 * Type-safe compliance API client.
 *
 * Rutas bajo `/compliance` y `/cpe-validator` en el contrato `App` → `getComplianceClient()` / `getCpeValidatorClient()` (no usan el prefijo `/api/...` de vendors/customers).
 */
export const complianceApi = {
	...roadmapApi,
	...sireApi,
	...accountingJobsApi,
	...cpeValidatorApi,
};
