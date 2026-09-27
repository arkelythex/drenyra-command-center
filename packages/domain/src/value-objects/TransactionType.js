export const ACCOUNTING_TRANSACTION_TYPES = ["SALE", "PURCHASE", "PAYMENT", "RECEIPT", "ADJUSTMENT", "TRANSFER"];
export const BANK_TRANSACTION_TYPES = [
    "DEBIT",
    "CREDIT",
];
export const CASHFLOW_TRANSACTION_TYPES = [
    "INCOME",
    "EXPENSE",
];
export const ACCOUNTING_TRANSACTION_TYPE_LABELS = {
    SALE: "Venta",
    PURCHASE: "Compra",
    PAYMENT: "Pago",
    RECEIPT: "Cobro",
    ADJUSTMENT: "Ajuste",
    TRANSFER: "Transferencia",
};
export const BANK_TRANSACTION_TYPE_LABELS = {
    DEBIT: "Débito",
    CREDIT: "Crédito",
};
export const CASHFLOW_TRANSACTION_TYPE_LABELS = {
    INCOME: "Ingreso",
    EXPENSE: "Egreso",
};
export function isAccountingTransactionType(value) {
    return (typeof value === "string" &&
        ACCOUNTING_TRANSACTION_TYPES.includes(value));
}
export function isBankTransactionType(value) {
    return (typeof value === "string" &&
        BANK_TRANSACTION_TYPES.includes(value));
}
export function isCashflowTransactionType(value) {
    return (typeof value === "string" &&
        CASHFLOW_TRANSACTION_TYPES.includes(value));
}
//# sourceMappingURL=TransactionType.js.map