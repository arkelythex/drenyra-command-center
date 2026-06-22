import type { OpenRouterTool, OpenRouterService, OpenRouterRequest } from '../openrouter';
import { type ToolStreamEvent, type ToolApprovalRequest } from './types';
export declare function getOpenRouterTools(): OpenRouterTool[];
export declare function streamWithToolExecution(service: OpenRouterService, request: OpenRouterRequest, options?: {
    maxToolIterations?: number;
    criticalTools?: Set<string>;
    approvalHandler?: (request: ToolApprovalRequest) => Promise<boolean>;
}): AsyncGenerator<ToolStreamEvent>;
//# sourceMappingURL=bridge.d.ts.map