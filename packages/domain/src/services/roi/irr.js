import { InvalidFinancialInputError } from "./types";
const MAX_ITERATIONS = 1000;
const TOLERANCE = 0.0001;
const INITIAL_GUESS = 0.1;
const CASH_FLOW_MINIMUM = 2;
export function calculateIrr(input) {
    const { initialInvestment, cashFlows } = input;
    if (cashFlows.length < CASH_FLOW_MINIMUM - 1) {
        throw new InvalidFinancialInputError(`At least ${CASH_FLOW_MINIMUM - 1} cash flow period is required for IRR calculation`);
    }
    const cashFlowCents = [
        -initialInvestment.getCents(),
        ...cashFlows.map((cf) => cf.getCents()),
    ];
    const hasPositiveFlow = cashFlowCents.some((cf) => cf > 0);
    if (!hasPositiveFlow) {
        return { irr: -100, converged: false, iterations: 0 };
    }
    let guess = INITIAL_GUESS;
    for (let i = 0; i < MAX_ITERATIONS; i++) {
        let npv = 0;
        let npvDerivative = 0;
        for (let t = 0; t < cashFlowCents.length; t++) {
            const denominator = (1 + guess) ** t;
            npv += cashFlowCents[t] / denominator;
            npvDerivative += (-t * cashFlowCents[t]) / (1 + guess) ** (t + 1);
        }
        if (Math.abs(npvDerivative) < 1e-15) {
            break;
        }
        const newGuess = guess - npv / npvDerivative;
        if (Math.abs(newGuess - guess) < TOLERANCE / 100) {
            const irrPercentage = roundToDec(newGuess * 100, 4);
            return {
                irr: irrPercentage,
                converged: true,
                iterations: i + 1,
            };
        }
        guess = newGuess;
    }
    const irrPercentage = roundToDec(guess * 100, 4);
    return {
        irr: irrPercentage,
        converged: false,
        iterations: MAX_ITERATIONS,
    };
}
function roundToDec(value, decimals) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
//# sourceMappingURL=irr.js.map