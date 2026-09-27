export interface AuthContext {
    userId: string;
    user: User;
    organization: Organization;
}
export interface Organization {
    id: number;
    isActive: boolean;
    [key: string]: unknown;
}
export interface User {
    id: string;
    organizationId: number;
    [key: string]: unknown;
}
export declare function requireAuth(): Promise<string>;
export declare function requireUser(): Promise<User>;
export declare function requireOrganization(): Promise<Organization>;
export declare function requireAuthContext(): Promise<AuthContext>;
export declare function getClerkUser(): Promise<any>;
export declare function syncUserFromClerk(clerkUserId: string): Promise<{
    id: string;
    email: string;
    password: string;
    name: string;
    role: string;
    companyId: string | null;
    avatarUrl: string | null;
    isActive: boolean | null;
    createdAt: Date;
    updatedAt: Date;
} | null | undefined>;
export declare function createUserWithOrganization(clerkUserId: string, organizationId: number, role?: "owner" | "senior" | "junior" | "client"): Promise<{
    email: string;
    password: string;
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean | null;
    role: string;
    companyId: string | null;
    avatarUrl: string | null;
} | undefined>;
export declare function userBelongsToOrganization(userId: string, organizationId: number): Promise<boolean>;
export declare function getUserOrganizationId(): Promise<number>;
export declare function getClientIP(headers: Headers): string | undefined;
export declare function getUserAgent(headers: Headers): string | undefined;
//# sourceMappingURL=auth-utils.d.ts.map