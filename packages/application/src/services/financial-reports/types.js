export function classifyAccount(code) {
    const firstDigit = parseInt(code.charAt(0), 10);
    const firstTwoDigits = parseInt(code.substring(0, 2), 10);
    const isAsset = firstDigit >= 1 && firstDigit <= 3;
    const isLiability = firstDigit === 4;
    const isEquity = firstDigit === 5;
    const isExpense = firstDigit === 6 || firstDigit === 9;
    const isRevenue = firstDigit === 7;
    const isCost = firstTwoDigits === 69;
    const nature = isAsset || isExpense || isCost ? "DEBIT" : "CREDIT";
    return {
        class: firstDigit,
        isAsset,
        isLiability,
        isEquity,
        isRevenue,
        isExpense,
        isCost,
        nature,
    };
}
//# sourceMappingURL=types.js.map