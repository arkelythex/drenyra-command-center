export class FeosError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(message);
        this.name = "FeosError";
        this.code = code;
        this.details = details;
    }
}
let _idCounter = 0;
export function generateId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    _idCounter += 1;
    return `id-${Date.now()}-${_idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}
export function nowISO() {
    return new Date().toISOString();
}
export function nowTimestamp() {
    const d = new Date();
    return { iso: d.toISOString(), unix: d.getTime() };
}
const MONTH_LABELS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
export function createPeriodRef(year, month) {
    if (!Number.isInteger(year) || year < 2020 || year > 2100) {
        throw new FeosError("INVALID_YEAR", `Year ${year} out of range [2020, 2100]`);
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new FeosError("INVALID_MONTH", `Month ${month} out of range [1, 12]`);
    }
    return { year, month, label: `${MONTH_LABELS[month - 1]} ${year}` };
}
//# sourceMappingURL=types.js.map