import type { GovernanceBundleReference } from "@drenyra/domain";
export interface GovernanceBundlePort {
	verify(bundle: GovernanceBundleReference): Promise<boolean>;
}
//# sourceMappingURL=governance-bundle.port.d.ts.map
