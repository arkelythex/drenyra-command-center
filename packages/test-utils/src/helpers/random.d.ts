export declare function randomInt(min: number, max: number): number;
export declare function randomFloat(min: number, max: number, decimals?: number): number;
export declare function randomPick<T>(arr: readonly T[]): T;
export declare function randomString(length?: number): string;
export declare function randomEmail(domain?: string): string;
export declare function randomPhone(): string;
export declare function randomRUC(type?: "company" | "person"): string;
export declare function randomDNI(): string;
export declare function randomId(prefix?: string): string;
export declare function randomAccountCode(level?: "1" | "2" | "3" | "4" | "5"): string;
export declare function seededRandom(seed: number): {
    next: () => number;
    int: (min: number, max: number) => number;
    float: (min: number, max: number, decimals?: number) => number;
    pick: <T>(arr: readonly T[]) => T;
    string: (length?: number) => string;
};
//# sourceMappingURL=random.d.ts.map