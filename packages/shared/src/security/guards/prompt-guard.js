const BLOCKED_PATTERNS = {
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
export function evaluatePrompt(prompt) {
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
export function evaluateActionType(action) {
	const upperAction = action.toUpperCase();
	return {
		isDestructive: DESTRUCTIVE_ACTIONS.has(upperAction),
		requiresAudit: DESTRUCTIVE_ACTIONS.has(upperAction),
		requiresAdmin:
			upperAction.includes("OVERRIDE") || upperAction.includes("DELETE"),
	};
}
export function createAuditTrailEntry(action, prompt, result, userId) {
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
//# sourceMappingURL=prompt-guard.js.map
