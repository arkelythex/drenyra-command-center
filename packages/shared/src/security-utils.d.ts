export declare function sanitizeSqlInput(input: string, maxLength?: number): string;
export declare function sanitizeUuid(uuid: string): string | null;
export declare function sanitizeMonetaryValue(value: string | number, maxDecimals?: number): string | null;
export declare function sanitizeInvoiceNumber(number: string): string;
export declare function createSafeLikePattern(searchTerm: string): {
    pattern: string;
    isValid: boolean;
};
export declare function sanitizeDateRange(startDate: string | Date, endDate: string | Date): {
    isValid: boolean;
    start: Date | null;
    end: Date | null;
    error?: string;
};
export declare const SECURITY_CONSTANTS: {
    readonly MAX_SEARCH_LENGTH: 100;
    readonly MAX_INVOICE_NUMBER_LENGTH: 20;
    readonly MAX_QUERY_LIMIT: 1000;
    readonly DEFAULT_QUERY_LIMIT: 50;
    readonly MAX_DATE_RANGE_DAYS: 365;
    readonly ALLOWED_SORT_FIELDS: readonly ["createdAt", "updatedAt", "totalAmount", "issueDate"];
    readonly ALLOWED_SORT_ORDERS: readonly ["asc", "desc"];
};
export declare function sanitizePagination(limit: number | string, offset: number | string): {
    limit: number;
    offset: number;
    isValid: boolean;
};
//# sourceMappingURL=security-utils.d.ts.map