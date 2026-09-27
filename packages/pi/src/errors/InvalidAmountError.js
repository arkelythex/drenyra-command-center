export class InvalidAmountError extends Error {
    constructor(amount, message) {
        super(message ?? `Invalid amount: ${amount}`);
    }
}
//# sourceMappingURL=InvalidAmountError.js.map