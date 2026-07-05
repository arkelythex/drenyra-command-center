import type {
	OpenRouterRequest,
	OpenRouterService,
	OpenRouterTool,
} from "../openrouter";
import { type ToolApprovalRequest, type ToolStreamEvent } from "./types";
export declare function getOpenRouterTools(): OpenRouterTool[];
export declare function streamWithToolExecution(
	service: OpenRouterService,
	request: OpenRouterRequest,
	options?: {
		maxToolIterations?: number;
		criticalTools?: Set<string>;
		approvalHandler?: (request: ToolApprovalRequest) => Promise<boolean>;
	},
): AsyncGenerator<ToolStreamEvent>;
//# sourceMappingURL=bridge.d.ts.map
