import type { GovernanceBundleReference } from "@drenyra/domain";

/**
 * Governance bundle validation port.
 */
export interface GovernanceBundlePort {
	verify(bundle: GovernanceBundleReference): Promise<boolean>;
}
