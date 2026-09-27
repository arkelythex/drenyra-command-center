import { Money } from "../value-objects/Money";
export type DetraccionStatus = "pendiente" | "depositado" | "usado" | "liberado";
export declare const SPOT_CODE_REGISTRY: Record<string, {
    code: string;
    description: string;
}>;
export type SpotCode = keyof typeof SPOT_CODE_REGISTRY;
export declare class Detraccion {
    private readonly _id;
    private readonly _spotCode;
    private readonly _percentage;
    private readonly _amount;
    private readonly _reference;
    private readonly _status;
    private readonly _createdAt;
    private readonly _updatedAt;
    private constructor();
    static create(id: string, spotCode: string, percentage: number, amount: Money, reference: string): Detraccion;
    get id(): string;
    get spotCode(): SpotCode;
    get spotCodeInfo(): {
        code: string;
        description: string;
    };
    get percentage(): number;
    get amount(): Money;
    get reference(): string;
    get status(): DetraccionStatus;
    get createdAt(): Date;
    get updatedAt(): Date;
    deposit(): Detraccion;
    use(): Detraccion;
    release(): Detraccion;
    isDeposited(): boolean;
    isUsed(): boolean;
    isReleased(): boolean;
    equals(other: Detraccion | null | undefined): boolean;
    toString(): string;
    toJSON(): Record<string, unknown>;
    static fromJSON(json: {
        id: string;
        spotCode: string;
        percentage: number;
        amount: Parameters<typeof Money.fromJSON>[0];
        reference: string;
    }): Detraccion;
}
export declare class InvalidDetraccionError extends Error {
    readonly field: string;
    constructor(field: string, message?: string);
    toJSON(): Record<string, unknown>;
}
export declare class InvalidDetraccionTransitionError extends Error {
    readonly currentStatus: DetraccionStatus;
    readonly targetStatus: DetraccionStatus;
    constructor(currentStatus: DetraccionStatus, targetStatus: DetraccionStatus, message?: string);
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=detraccion.d.ts.map