/**
 * AuditPluginCapability type.
 *
 * @example
 * ```ts
 * const value: AuditPluginCapability = {} as AuditPluginCapability;
 * console.log(value);
 * ```
 */
export type AuditPluginCapability =
	| "audit:read-inputs"
	| "audit:read-outputs"
	| "audit:read-reasoning"
	| "audit:emit-finding";

/**
 * AuditFindingSeverity type.
 *
 * @example
 * ```ts
 * const value: AuditFindingSeverity = {} as AuditFindingSeverity;
 * console.log(value);
 * ```
 */
export type AuditFindingSeverity = "low" | "medium" | "high" | "critical";

/**
 * AuditPluginPathOperator type.
 *
 * @example
 * ```ts
 * const value: AuditPluginPathOperator = {} as AuditPluginPathOperator;
 * console.log(value);
 * ```
 */
export type AuditPluginPathOperator =
	| "eq"
	| "neq"
	| "gt"
	| "gte"
	| "lt"
	| "lte"
	| "includes"
	| "exists";

/**
 * AuditPluginPathCondition interface.
 *
 * @example
 * ```ts
 * const value: AuditPluginPathCondition = {} as AuditPluginPathCondition;
 * console.log(value);
 * ```
 */
export interface AuditPluginPathCondition {
	kind: "path";
	path: string;
	operator: AuditPluginPathOperator;
	value?: unknown;
}

/**
 * AuditPluginDeltaCondition interface.
 *
 * @example
 * ```ts
 * const value: AuditPluginDeltaCondition = {} as AuditPluginDeltaCondition;
 * console.log(value);
 * ```
 */
export interface AuditPluginDeltaCondition {
	kind: "delta";
	leftPath: string;
	rightPath: string;
	operator: "gt" | "gte" | "lt" | "lte";
	value: number;
}

/**
 * AuditPluginCondition type.
 *
 * @example
 * ```ts
 * const value: AuditPluginCondition = {} as AuditPluginCondition;
 * console.log(value);
 * ```
 */
export type AuditPluginCondition =
	| AuditPluginPathCondition
	| AuditPluginDeltaCondition;

/**
 * AuditPluginScope interface.
 *
 * @example
 * ```ts
 * const value: AuditPluginScope = {} as AuditPluginScope;
 * console.log(value);
 * ```
 */
export interface AuditPluginScope {
	organizationIds?: number[];
	agentNames?: string[];
	decisionTypes?: string[];
}

/**
 * AuditPluginFindingTemplate interface.
 *
 * @example
 * ```ts
 * const value: AuditPluginFindingTemplate = {} as AuditPluginFindingTemplate;
 * console.log(value);
 * ```
 */
export interface AuditPluginFindingTemplate {
	code: string;
	message: string;
	severity: AuditFindingSeverity;
	recommendedAction?: string;
}

/**
 * AuditPluginDefinition interface.
 *
 * @example
 * ```ts
 * const value: AuditPluginDefinition = {} as AuditPluginDefinition;
 * console.log(value);
 * ```
 */
export interface AuditPluginDefinition {
	id: string;
	name: string;
	version: string;
	description: string;
	capabilities: AuditPluginCapability[];
	allowedPaths: string[];
	scope?: AuditPluginScope;
	logic?: "all" | "any";
	enabled?: boolean;
	conditions: AuditPluginCondition[];
	finding: AuditPluginFindingTemplate;
}

/**
 * AuditPluginExecutionContext interface.
 *
 * @example
 * ```ts
 * const value: AuditPluginExecutionContext = {} as AuditPluginExecutionContext;
 * console.log(value);
 * ```
 */
export interface AuditPluginExecutionContext {
	organizationId: number;
	agentName: string;
	decisionType: string;
	reasoning?: string;
	inputs: Record<string, unknown>;
	outputs: Record<string, unknown>;
	occurredAt: Date;
}

/**
 * AuditPluginFinding interface.
 *
 * @example
 * ```ts
 * const value: AuditPluginFinding = {} as AuditPluginFinding;
 * console.log(value);
 * ```
 */
export interface AuditPluginFinding extends AuditPluginFindingTemplate {
	pluginId: string;
	pluginVersion: string;
	matchedAt: string;
}

/**
 * AuditPluginSkipInfo interface.
 *
 * @example
 * ```ts
 * const value: AuditPluginSkipInfo = {} as AuditPluginSkipInfo;
 * console.log(value);
 * ```
 */
export interface AuditPluginSkipInfo {
	pluginId: string;
	reason: string;
}

/**
 * AuditPluginExecutionResult interface.
 *
 * @example
 * ```ts
 * const value: AuditPluginExecutionResult = {} as AuditPluginExecutionResult;
 * console.log(value);
 * ```
 */
export interface AuditPluginExecutionResult {
	evaluatedPluginIds: string[];
	findings: AuditPluginFinding[];
	skipped: AuditPluginSkipInfo[];
}

