import { BaseBuilder } from "./base.builder";
const DEFAULT_USER_ID = "usr_test_001";
const DEFAULT_EMAIL = "test.user@drenyrafounders.com";
const DEFAULT_NAME = "Usuario de Prueba";
const DEFAULT_ROLE = "user";
const DEFAULT_TENANT_ID = 1;
export class UserBuilder extends BaseBuilder {
    constructor() {
        const now = new Date();
        super({
            id: DEFAULT_USER_ID,
            email: DEFAULT_EMAIL,
            name: DEFAULT_NAME,
            role: DEFAULT_ROLE,
            tenantId: DEFAULT_TENANT_ID,
            isActive: true,
            emailVerified: true,
            createdAt: now,
            updatedAt: now,
        });
    }
    withId(id) {
        return this.set({ id });
    }
    withEmail(email) {
        return this.set({ email });
    }
    withName(name) {
        return this.set({ name });
    }
    withRole(role) {
        return this.set({ role });
    }
    withTenantId(tenantId) {
        return this.set({ tenantId });
    }
    asInactive() {
        return this.set({ isActive: false });
    }
    asActive() {
        return this.set({ isActive: true });
    }
    asUnverified() {
        return this.set({ emailVerified: false });
    }
    withLastLoginAt(date) {
        return this.set({ lastLoginAt: date });
    }
    build() {
        const now = new Date();
        return {
            id: this.data.id ?? DEFAULT_USER_ID,
            email: this.data.email ?? DEFAULT_EMAIL,
            name: this.data.name ?? DEFAULT_NAME,
            role: this.data.role ?? DEFAULT_ROLE,
            tenantId: this.data.tenantId ?? DEFAULT_TENANT_ID,
            isActive: this.data.isActive ?? true,
            emailVerified: this.data.emailVerified ?? true,
            lastLoginAt: this.data.lastLoginAt,
            createdAt: this.data.createdAt ?? now,
            updatedAt: this.data.updatedAt ?? now,
        };
    }
}
//# sourceMappingURL=user.builder.js.map