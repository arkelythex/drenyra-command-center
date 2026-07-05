export interface PromptGuardResult {
	allowed: boolean;
	reason?: string;
	blockedKeyword?: string;
	requiresAdminOverride?: boolean;
}
export type BlockedAction =
	| "DELETE_LEDGER"
	| "DROP_TABLE"
	| "DELETE_ALL"
	| "OVERRIDE_FISCAL"
	| "DISABLE_AUDIT"
	| "MODIFY_TAX_DATA"
	| "EXPORT_SENSITIVE";
export declare function evaluatePrompt(prompt: string): PromptGuardResult;
export declare function evaluateActionType(action: string): {
	isDestructive: boolean;
	requiresAudit: boolean;
	requiresAdmin: boolean;
};
export declare function createAuditTrailEntry(
	action: string,
	prompt: string,
	result: PromptGuardResult,
	userId?: string,
): Record<string, unknown>;
//# sourceMappingURL=prompt-guard.d.ts.map
