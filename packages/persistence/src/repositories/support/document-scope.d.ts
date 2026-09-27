import { type SQL } from "drizzle-orm";
export declare const buildDocumentCompanyScope: (companyId: string) => SQL;
export declare const buildDocumentCompanyCompatibilityScope: (companyId: string, legacyOrganizationId: number | null) => SQL;
export declare const buildDocumentOrganizationScope: (organizationId: number, companyId: string | null) => SQL;
//# sourceMappingURL=document-scope.d.ts.map