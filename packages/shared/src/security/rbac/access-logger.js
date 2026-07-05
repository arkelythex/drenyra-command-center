export const ADMIN_ONLY_ACTIONS = [
	"company:delete",
	"users:create_staff",
	"audit:read",
	"accounting:close",
];
export const PROTECTED_RESOURCES = [
	"ledger:delete",
	"ledger:override",
	"journal:delete",
	"users:delete",
];
export function requiresAdminRole(action) {
	return ADMIN_ONLY_ACTIONS.includes(action);
}
export function isProtectedResource(resource) {
	return PROTECTED_RESOURCES.includes(resource);
}
export function shouldLogAccess(action, result) {
	if (result === "DENY" || result === "FAILED") return true;
	return isProtectedResource(action) || requiresAdminRole(action);
}
export function createAccessLogEntry(
	userId,
	action,
	resource,
	result,
	options,
) {
	return {
		id: crypto.randomUUID(),
		userId,
		action,
		resource,
		result,
		timestamp: new Date(),
		...options,
	};
}
export function createFailedLoginEntry(email, ipAddress, reason) {
	return {
		email,
		ipAddress,
		timestamp: new Date(),
		reason,
	};
}
//# sourceMappingURL=access-logger.js.map
