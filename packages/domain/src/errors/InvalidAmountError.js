export class InvalidAmountError extends Error {
    invalidValue;
    constructor(invalidValue, message) {
        super(message || `Monto inválido: ${invalidValue}`);
        this.invalidValue = invalidValue;
        this.name = "InvalidAmountError";
        const ErrorWithCapture = Error;
        if (ErrorWithCapture.captureStackTrace) {
            ErrorWithCapture.captureStackTrace(this, InvalidAmountError);
        }
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            invalidValue: this.invalidValue,
            code: "INVALID_AMOUNT",
        };
    }
}
//# sourceMappingURL=InvalidAmountError.js.map