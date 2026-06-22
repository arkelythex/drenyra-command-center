import { type ModelTask } from "./models";
declare class AdaptiveRouter {
    private metrics;
    route(task: ModelTask): Promise<{
        model: import("@ai-sdk/provider").LanguageModelV3;
        recordMetrics: (inputTokens: number, outputTokens: number, success: boolean) => void;
    }>;
    private getModelType;
    private calculateCost;
    getStats(): {
        totalCost: number;
        totalRequests: number;
        avgDuration: number;
        successRate: number;
        byTask: Record<string, {
            count: number;
            totalCost: number;
            avgDuration: number;
            successRate: number;
        }>;
    };
    clearMetrics(): void;
}
export declare const aiRouter: AdaptiveRouter;
export declare function logAIOperation(task: ModelTask, cost: number, duration: number): void;
export {};
//# sourceMappingURL=router.d.ts.map