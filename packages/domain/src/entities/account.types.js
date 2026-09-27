export const ACCOUNT_LEVEL_NAMES = {
    "1": "Rubro",
    "2": "Cuenta",
    "3": "Sub-Cuenta",
    "4": "Divisionaria",
    "5": "Sub-Divisionaria",
};
export const ACCOUNT_TYPE_CLASSES = {
    Activo: ["1", "2", "3"],
    Pasivo: ["4"],
    Patrimonio: ["5"],
    Gasto: ["6"],
    Ingreso: ["7"],
    Saldo: ["8"],
    Costo: ["9"],
};
export const EXPECTED_CODE_LENGTH = {
    "1": 2,
    "2": 3,
    "3": 4,
    "4": 5,
    "5": 6,
};
export function getExpectedCodeLength(level) {
    return EXPECTED_CODE_LENGTH[level] ?? 2;
}
export function validateTypeMatchesCode(type, code) {
    const firstDigit = code.charAt(0);
    const allowedClasses = ACCOUNT_TYPE_CLASSES[type];
    if (!allowedClasses.includes(firstDigit)) {
        throw new Error(`El tipo "${type}" no es válido para códigos que empiezan con ${firstDigit}`);
    }
}
//# sourceMappingURL=account.types.js.map