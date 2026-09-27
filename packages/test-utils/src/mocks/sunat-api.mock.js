import { vi } from "vitest";
export function createSunatMock() {
    return {
        sendInvoice: vi.fn(),
        getStatus: vi.fn(),
        queryCDR: vi.fn(),
        validateRUC: vi.fn(),
    };
}
export function sunatSuccess(overrides) {
    return {
        ticket: `TK-${Date.now()}`,
        status: "accepted",
        cdrCode: "0",
        cdrDescription: "El comprobante ha sido aceptado",
        responseDate: new Date(),
        ...overrides,
    };
}
export function sunatRejection(overrides) {
    return {
        ticket: `TK-${Date.now()}`,
        status: "rejected",
        cdrCode: "3076",
        cdrDescription: "El RUC del cliente no existe en la base de datos de SUNAT",
        errorMessage: "RUC no encontrado",
        responseDate: new Date(),
        ...overrides,
    };
}
export function sunatPending(overrides) {
    return {
        ticket: `TK-${Date.now()}`,
        status: "pending",
        responseDate: new Date(),
        ...overrides,
    };
}
export function sunatError(overrides) {
    return {
        status: "error",
        errorMessage: "Error de conexión con SUNAT",
        ...overrides,
    };
}
export function rucValidationSuccess(ruc = "20601234567") {
    return {
        valid: true,
        info: {
            ruc,
            razonSocial: "EMPRESA DE PRUEBA SAC",
            estado: "ACTIVO",
            condicion: "HABIDO",
            direccion: "AV. TEST 123, LIMA",
        },
    };
}
export function rucValidationFailure() {
    return {
        valid: false,
        info: undefined,
    };
}
const OBSERVACION_DESCRIPTIONS = {
    "1": "El RUC del emisor no se encuentra activo",
    "2": "El RUC del cliente no se encuentra activo",
    "3": "La serie del comprobante no corresponde al tipo",
    "4": "El número de comprobante ya fue registrado",
    "5": "El monto total no coincide con el calculado",
    "6": "La fecha de emisión no es válida",
};
export function sunatObservacion(cdrCode) {
    return {
        ticket: `TK-${Date.now()}`,
        status: "rejected",
        cdrCode,
        cdrDescription: OBSERVACION_DESCRIPTIONS[cdrCode] ?? "Observación no especificada",
        errorMessage: `Observación código ${cdrCode}: ${OBSERVACION_DESCRIPTIONS[cdrCode] ?? "Desconocida"}`,
        responseDate: new Date(),
    };
}
export function sunatHardRejection(cdrCode) {
    const messages = {
        "3076": "El RUC del cliente no existe en la base de datos de SUNAT",
        "3099": "El comprobante no cumple con las validaciones de SUNAT",
        "3100": "Error interno en el procesamiento de SUNAT",
        "3150": "La firma digital del comprobante no es válida",
    };
    return {
        ticket: `TK-${Date.now()}`,
        status: "rejected",
        cdrCode,
        cdrDescription: messages[cdrCode] ?? "Error no especificado en la validación de SUNAT",
        errorMessage: messages[cdrCode] ?? `Error SUNAT código ${cdrCode}`,
        responseDate: new Date(),
    };
}
export function sunatTimeout(delayMs) {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`SUNAT timeout after ${delayMs}ms: El servicio de SUNAT no respondió dentro del tiempo esperado`));
        }, delayMs);
    });
}
//# sourceMappingURL=sunat-api.mock.js.map