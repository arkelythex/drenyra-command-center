export const BANK_ACCOUNT_TYPES = [
    "CHECKING",
    "SAVINGS",
    "CREDIT",
];
export const ACCOUNT_TYPES = BANK_ACCOUNT_TYPES;
export const BANK_ACCOUNT_TYPE_LABELS = {
    CHECKING: "Cuenta Corriente",
    SAVINGS: "Cuenta de Ahorros",
    CREDIT: "Línea de Crédito",
};
export function isBankAccountType(value) {
    return (typeof value === "string" &&
        BANK_ACCOUNT_TYPES.includes(value));
}
export function assertBankAccountType(value) {
    if (!isBankAccountType(value)) {
        throw new Error(`Invalid BankAccountType: "${value}". Must be one of: ${BANK_ACCOUNT_TYPES.join(", ")}`);
    }
    return value;
}
//# sourceMappingURL=AccountType.js.map