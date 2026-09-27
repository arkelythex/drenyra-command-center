import { BaseBuilder } from "./base.builder";
export interface UserData {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: number;
    isActive: boolean;
    emailVerified: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class UserBuilder extends BaseBuilder<UserData> {
    constructor();
    withId(id: string): this;
    withEmail(email: string): this;
    withName(name: string): this;
    withRole(role: string): this;
    withTenantId(tenantId: number): this;
    asInactive(): this;
    asActive(): this;
    asUnverified(): this;
    withLastLoginAt(date: Date): this;
    build(): UserData;
}
//# sourceMappingURL=user.builder.d.ts.map