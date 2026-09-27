import type { SunatResponse } from "./types";
export declare function createSunatMock(): {
    sendInvoice: import("vitest").Mock<() => Promise<SunatResponse>>;
    getStatus: import("vitest").Mock<() => Promise<SunatResponse>>;
    queryCDR: import("vitest").Mock<() => Promise<SunatResponse>>;
    validateRUC: import("vitest").Mock<() => Promise<{
        valid: boolean;
        info?: Record<string, unknown>;
    }>>;
};
export declare function sunatSuccess(overrides?: Partial<SunatResponse>): SunatResponse;
export declare function sunatRejection(overrides?: Partial<SunatResponse>): SunatResponse;
export declare function sunatPending(overrides?: Partial<SunatResponse>): SunatResponse;
export declare function sunatError(overrides?: Partial<SunatResponse>): SunatResponse;
export declare function rucValidationSuccess(ruc?: string): {
    valid: boolean;
    info: {
        ruc: string;
        razonSocial: string;
        estado: string;
        condicion: string;
        direccion: string;
    };
};
export declare function rucValidationFailure(): {
    valid: boolean;
    info: undefined;
};
export declare function sunatObservacion(cdrCode: "1" | "2" | "3" | "4" | "5" | "6"): SunatResponse;
export declare function sunatHardRejection(cdrCode: string): SunatResponse;
export declare function sunatTimeout(delayMs: number): Promise<SunatResponse>;
//# sourceMappingURL=sunat-api.mock.d.ts.map