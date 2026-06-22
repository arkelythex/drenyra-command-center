import type { GovernanceBundleReference } from "@arkelythex/domain";
export interface GovernanceBundlePort {
    verify(bundle: GovernanceBundleReference): Promise<boolean>;
}
//# sourceMappingURL=governance-bundle.port.d.ts.map