export class InvalidRUCError extends Error {
    constructor(ruc, message) {
        super(message ?? `Invalid RUC: ${ruc}`);
    }
}
//# sourceMappingURL=InvalidRUCError.js.map