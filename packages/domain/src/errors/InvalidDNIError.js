export class InvalidDNIError extends Error {
    constructor(dni) {
        super(`DNI inválido: "${dni}". El DNI debe tener exactamente 8 dígitos numéricos.`);
        this.name = "InvalidDNIError";
        Object.setPrototypeOf(this, InvalidDNIError.prototype);
    }
}
//# sourceMappingURL=InvalidDNIError.js.map