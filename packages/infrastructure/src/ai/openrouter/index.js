export { OpenRouterService } from "./client/index.js";
export * from "./types.js";

import { OpenRouterService } from "./client/index.js";
export const openRouter = new OpenRouterService({
	apiKey: process.env.OPENROUTER_API_KEY || "",
	budgetLimit: parseFloat(process.env.OPENROUTER_BUDGET || "1000"),
	enableAutoRouting: true,
});
//# sourceMappingURL=index.js.map
