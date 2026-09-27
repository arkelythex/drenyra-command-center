import type { PermissionContext, PermissionEffect, PermissionEntry, PermissionResult } from "../control-plane/contracts";
export declare class PermissionService {
    private permissions;
    load(entries: PermissionEntry[]): void;
    canExecute(toolName: string, context?: PermissionContext): PermissionResult;
    private lookupPermission;
    setPermission(toolName: string, effect: PermissionEffect, companyId?: string): void;
    getAllPermissions(): Map<string, PermissionEffect>;
}
//# sourceMappingURL=permission-service.d.ts.map