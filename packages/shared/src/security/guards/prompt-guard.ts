/**
 * Decision produced after evaluating a user prompt for risky intent.
 *
 * @example
 * ```ts
 * const result: PromptGuardResult = { allowed: false, blockedKeyword: "DROP_TABLE" };
 * ```
 */
export interface PromptGuardResult {
	allowed: boolean;
	reason?: string;
	blockedKeyword?: string;
	requiresAdminOverride?: boolean;
}

/**
 * Canonical action categories blocked by prompt guard policies.
 *
 * @example
 * ```ts
 * const action: BlockedAction = "DELETE_LEDGER";
 * ```
 */
export type BlockedAction =
	| "DELETE_LEDGER"
	| "DROP_TABLE"
	| "DELETE_ALL"
	| "OVERRIDE_FISCAL"
	| "DISABLE_AUDIT"
	| "MODIFY_TAX_DATA"
	| "EXPORT_SENSITIVE";

const BLOCKED_PATTERNS: Record<BlockedAction, RegExp> = {
	DELETE_LEDGER:
		/(?:borrar|eliminar|delete).*(?:libro.*mayor|ledger|asientos.*contables)/i,
	DROP_TABLE: /(?:drop|truncate|eliminar.*tabla|delete.*table)/i,
	DELETE_ALL: /(?:borrar.*todo|eliminar.*todo|delete.*all|truncate.*database)/i,
	OVERRIDE_FISCAL:
		/(?:override|modificar|cambiar).*(?:igv|sunat|impuesto|factura.*electronica)/i,
	DISABLE_AUDIT:
		/(?:desactivar|disable|eliminar).*(?:audit|log|registro.*auditoria)/i,
	MODIFY_TAX_DATA:
		/(?:modificar|cambiar|editar).*(?:datos.*tributarios|ruc|registros.*sunat)/i,
	EXPORT_SENSITIVE:
		/(?:exportar|descargar|dump|export).*(?:contraseñas|passwords|credenciales|keys|secretos)/i,
};

const DESTRUCTIVE_ACTIONS = new Set([
	"DELETE",
	"DROP",
	"TRUNCATE",
	"OVERRIDE",
	"MODIFY",
	"UPDATE_ALL",
	"BULK_DELETE",
]);

/**
 * Checks free-text prompts against destructive/security-sensitive patterns.
 *
 * @param prompt - User prompt text to evaluate
 * @returns Guard decision including block reason when applicable
 * @example
 * ```ts
 * const result = evaluatePrompt("delete all ledger entries");
 * ```
 */
export function evaluatePrompt(prompt: string): PromptGuardResult {
	const lowerPrompt = prompt.toLowerCase();

	for (const [action, pattern] of Object.entries(BLOCKED_PATTERNS)) {
		if (pattern.test(lowerPrompt)) {
			const requiresOverride = ["OVERRIDE_FISCAL", "MODIFY_TAX_DATA"].includes(
				action,
			);

			return {
				allowed: false,
				reason: `Accion bloqueada: ${action}. Esta operacion requiere aprobacion manual de administrador.`,
				blockedKeyword: action,
				requiresAdminOverride: requiresOverride,
			};
		}
	}

	return { allowed: true };
}

/**
 * Classifies an action label by destructive/audit/admin requirements.
 *
 * @param action - Action identifier emitted by orchestration logic
 * @returns Flags used by authorization/audit pipelines
 * @example
 * ```ts
 * const policy = evaluateActionType("DELETE");
 * ```
 */
export function evaluateActionType(action: string): {
	isDestructive: boolean;
	requiresAudit: boolean;
	requiresAdmin: boolean;
} {
	const upperAction = action.toUpperCase();

	return {
		isDestructive: DESTRUCTIVE_ACTIONS.has(upperAction),
		requiresAudit: DESTRUCTIVE_ACTIONS.has(upperAction),
		requiresAdmin:
			upperAction.includes("OVERRIDE") || upperAction.includes("DELETE"),
	};
}

/**
 * Creates a normalized audit record for prompt-guard decisions.
 *
 * @param action - Action being requested
 * @param prompt - Original prompt text
 * @param result - Guard decision for the prompt
 * @param userId - Optional actor id
 * @returns Audit record payload suitable for persistence
 * @example
 * ```ts
 * const entry = createAuditTrailEntry("DELETE_LEDGER", "delete ledger", { allowed: false });
 * ```
 */
export function createAuditTrailEntry(
	action: string,
	prompt: string,
	result: PromptGuardResult,
	userId?: string,
): Record<string, unknown> {
	return {
		id: crypto.randomUUID(),
		timestamp: new Date().toISOString(),
		userId,
		action,
		prompt: prompt.substring(0, 200),
		allowed: result.allowed,
		reason: result.reason,
		blockedKeyword: result.blockedKeyword,
		requiresAdminOverride: result.requiresAdminOverride,
	};
}
