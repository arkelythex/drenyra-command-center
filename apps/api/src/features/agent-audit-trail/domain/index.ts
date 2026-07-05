/**
 * Domain Layer Exports
 * Consolidated exports for clean imports (2026 pattern)
 */

export type { AgentDecisionLogProps } from "./entity";
export { AgentDecisionLog } from "./entity";
export type { CreateLogInput } from "./factory";
export { createAgentDecisionLog } from "./factory";
export type { HashableData } from "./hash.service";
export { computeHash, verifyHash } from "./hash.service";
export type { AgentContextProps } from "./value-objects/agent-context.vo";
export { AgentContext } from "./value-objects/agent-context.vo";
export type { DecisionDataProps } from "./value-objects/decision-data.vo";
export { DecisionData } from "./value-objects/decision-data.vo";
export type { HashChainProps } from "./value-objects/hash-chain.vo";
export { HashChain } from "./value-objects/hash-chain.vo";
