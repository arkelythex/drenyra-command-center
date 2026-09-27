type ResolveOrganizationId = (companyId: string) => Promise<number | null>;
export declare const createOrganizationIdResolver: (resolveOrganizationId?: ResolveOrganizationId) => (companyId: string) => Promise<number | null>;
export {};
//# sourceMappingURL=organization-id-cache.d.ts.map