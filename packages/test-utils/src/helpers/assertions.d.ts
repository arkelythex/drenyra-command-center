import type { Money } from "@drenyra/domain/value-objects/Money";
export declare function assertMoneyEqual(actual: Money, expected: Money, toleranceCents?: number): void;
export declare function assertMoneyIsZero(m: Money): void;
export declare function assertMoneyIsPositive(m: Money): void;
export declare function assertInRange(value: number, min: number, max: number, label?: string): void;
export declare function assertLength<T>(arr: readonly T[], expected: number, label?: string): void;
export declare function assertNotEmpty<T>(arr: readonly T[], label?: string): void;
export declare function assertUniqueBy<T>(arr: readonly T[], keyFn: (item: T) => string | number, label?: string): void;
export declare function assertRejectsWith(promise: Promise<unknown>, expectedMessage: string): Promise<void>;
//# sourceMappingURL=assertions.d.ts.map