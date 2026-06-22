/**
 * Domain Layer Exports
 * Consolidated exports for clean imports (2026 pattern)
 */

export { AgentDecisionLog } from "./entity";
export type { AgentDecisionLogProps } from "./entity";

export { AgentContext } from "./value-objects/agent-context.vo";
export type { AgentContextProps } from "./value-objects/agent-context.vo";

export { DecisionData } from "./value-objects/decision-data.vo";
export type { DecisionDataProps } from "./value-objects/decision-data.vo";

export { HashChain } from "./value-objects/hash-chain.vo";
export type { HashChainProps } from "./value-objects/hash-chain.vo";

export { createAgentDecisionLog } from "./factory";
export type { CreateLogInput } from "./factory";

export { computeHash, verifyHash } from "./hash.service";
export type { HashableData } from "./hash.service";
