import type { GovernanceBundleReference } from "@arkelythex/domain";

/**
 * Governance bundle validation port.
 */
export interface GovernanceBundlePort {
	verify(bundle: GovernanceBundleReference): Promise<boolean>;
}
