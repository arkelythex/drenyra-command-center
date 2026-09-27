export type SunatStatus = "pendiente" | "enviado" | "aceptado" | "rechazado" | "observado" | "baja";
export interface CDRData {
    id: string;
    content: string;
    resultCode: string;
    resultDescription: string;
    ticket: string;
    receivedAt: Date;
}
export declare class CPELog {
    private readonly _id;
    private readonly _invoiceId;
    private readonly _sunatStatus;
    private readonly _submittedAt;
    private readonly _acceptedAt;
    private readonly _rejectedAt;
    private readonly _observedAt;
    private readonly _cancelledAt;
    private readonly _sunatTicket;
    private readonly _cdr;
    private readonly _hashValue;
    private readonly _hashAlgorithm;
    private readonly _errorMessage;
    private readonly _errorCode;
    private readonly _createdAt;
    private constructor();
    static create(id: string, invoiceId: string): CPELog;
    get id(): string;
    get invoiceId(): string;
    get sunatStatus(): SunatStatus;
    get submittedAt(): Date | null;
    get acceptedAt(): Date | null;
    get rejectedAt(): Date | null;
    get observedAt(): Date | null;
    get cancelledAt(): Date | null;
    get sunatTicket(): string | null;
    get cdr(): CDRData | null;
    get hashValue(): string | null;
    get hashAlgorithm(): string | null;
    get errorMessage(): string | null;
    get errorCode(): string | null;
    get createdAt(): Date;
    isSubmitted(): boolean;
    isAccepted(): boolean;
    isRejected(): boolean;
    isObserved(): boolean;
    isCancelled(): boolean;
    isTerminal(): boolean;
    submit(sunatTicket: string, hashValue: string, hashAlgorithm?: string): CPELog;
    accept(cdr: CDRData): CPELog;
    reject(reason: string, errorCode?: string): CPELog;
    observe(observation: string): CPELog;
    cancel(reason: string): CPELog;
    equals(other: CPELog | null | undefined): boolean;
    toString(): string;
    toJSON(): Record<string, unknown>;
    static fromJSON(json: {
        id: string;
        invoiceId: string;
    }): CPELog;
}
export declare class InvalidCPELogError extends Error {
    readonly field: string;
    constructor(field: string, message?: string);
    toJSON(): Record<string, unknown>;
}
export declare class InvalidCPELogTransitionError extends Error {
    readonly currentStatus: SunatStatus;
    readonly targetStatus: SunatStatus;
    constructor(currentStatus: SunatStatus, targetStatus: SunatStatus, message?: string);
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=cpe-log.d.ts.map