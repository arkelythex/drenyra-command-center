import { ValidationError } from "./AppError";
export class InvalidRUCError extends ValidationError {
    invalidValue;
    code = "FISCAL_INVALID_RUC";
    constructor(invalidValue, message) {
        super("ruc", message ||
            `RUC invalido: "${invalidValue}". Debe tener 11 digitos y pasar validacion modulo-11`);
        this.invalidValue = invalidValue;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            invalidValue: this.invalidValue,
        };
    }
}
//# sourceMappingURL=InvalidRUCError.js.map