const MONTHS_IN_YEAR = 12;
export function calculatePaybackPeriod(input) {
    const { initialInvestment, annualCashFlow } = input;
    if (initialInvestment.isZero()) {
        return { months: 0, years: 0, isInfinite: false };
    }
    if (annualCashFlow.isZero() || annualCashFlow.isNegative()) {
        return { months: Infinity, years: Infinity, isInfinite: true };
    }
    const exactMonths = (initialInvestment.getAmount() / annualCashFlow.getAmount()) *
        MONTHS_IN_YEAR;
    const months = Math.ceil(exactMonths);
    const years = roundToDec(months / MONTHS_IN_YEAR, 2);
    return { months, years, isInfinite: false };
}
function roundToDec(value, decimals) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
//# sourceMappingURL=payback-period.js.map