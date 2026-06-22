export type ServiceToken<T> = string & {
    readonly __type?: T;
};
export declare const SERVICE_TOKENS: {
    readonly BALANCE_REPORT_DATA_SOURCE: ServiceToken<unknown>;
    readonly ORGANIZATION_REPORT_DATA_SOURCE: ServiceToken<unknown>;
    readonly LEDGER_REPORT_DATA_SOURCE: ServiceToken<unknown>;
    readonly OPENING_BALANCE_DATA_SOURCE: ServiceToken<unknown>;
};
export declare function register<T>(token: ServiceToken<T>, value: T): void;
export declare function inject<T>(token: ServiceToken<T>): T | undefined;
//# sourceMappingURL=di-container.d.ts.map