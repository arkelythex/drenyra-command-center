import type { GovernanceBundleReference } from "@drenyra/domain";
import type { GovernanceBundlePort } from "../ports/governance-bundle.port";
export declare class GovernanceBundleService {
	private readonly governancePort;
	constructor(governancePort: GovernanceBundlePort);
	isApproved(bundle: GovernanceBundleReference): Promise<boolean>;
}
//# sourceMappingURL=governance-bundle.service.d.ts.map
