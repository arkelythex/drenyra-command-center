export class PermissionService {
    permissions = new Map();
    load(entries) {
        this.permissions.clear();
        for (const entry of entries) {
            const key = entry.companyId
                ? `${entry.toolName}:${entry.companyId}`
                : entry.toolName;
            this.permissions.set(key, entry.effect);
        }
    }
    canExecute(toolName, context) {
        const toolEntry = this.lookupPermission(toolName, context);
        if (!toolEntry) {
            return {
                effect: "REQUIRE_APPROVAL",
                source: "default",
            };
        }
        return { effect: toolEntry, source: "permission_entry" };
    }
    lookupPermission(toolName, context) {
        if (context?.companyId) {
            const companyKey = `${toolName}:${context.companyId}`;
            const entry = this.permissions.get(companyKey);
            if (entry)
                return entry;
        }
        return this.permissions.get(toolName);
    }
    setPermission(toolName, effect, companyId) {
        const key = companyId ? `${toolName}:${companyId}` : toolName;
        this.permissions.set(key, effect);
    }
    getAllPermissions() {
        return new Map(this.permissions);
    }
}
//# sourceMappingURL=permission-service.js.map