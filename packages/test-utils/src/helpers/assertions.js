export function assertMoneyEqual(actual, expected, toleranceCents = 0) {
    if (actual.getCurrency() !== expected.getCurrency()) {
        throw new Error(`Currency mismatch: expected ${expected.getCurrency()}, got ${actual.getCurrency()}`);
    }
    const diff = Math.abs(actual.getCents() - expected.getCents());
    if (diff > toleranceCents) {
        throw new Error(`Money mismatch: expected ${expected.getAmount()} (${expected.getCents()} cents), ` +
            `got ${actual.getAmount()} (${actual.getCents()} cents), ` +
            `difference: ${diff} cents (tolerance: ${toleranceCents})`);
    }
}
export function assertMoneyIsZero(m) {
    if (!m.isZero()) {
        throw new Error(`Expected zero, got ${m.getAmount()} ${m.getCurrency()}`);
    }
}
export function assertMoneyIsPositive(m) {
    if (!m.isPositive()) {
        throw new Error(`Expected positive amount, got ${m.getAmount()}`);
    }
}
export function assertInRange(value, min, max, label = "value") {
    if (value < min || value > max) {
        throw new Error(`${label} ${value} is not in range [${min}, ${max}]`);
    }
}
export function assertLength(arr, expected, label = "array") {
    if (arr.length !== expected) {
        throw new Error(`${label} length: expected ${expected}, got ${arr.length}`);
    }
}
export function assertNotEmpty(arr, label = "array") {
    if (arr.length === 0) {
        throw new Error(`${label} should not be empty`);
    }
}
export function assertUniqueBy(arr, keyFn, label = "array") {
    const seen = new Set();
    for (const item of arr) {
        const key = keyFn(item);
        if (seen.has(key)) {
            throw new Error(`${label} has duplicate key: ${key}`);
        }
        seen.add(key);
    }
}
export async function assertRejectsWith(promise, expectedMessage) {
    try {
        await promise;
        throw new Error("Expected promise to reject, but it resolved");
    }
    catch (error) {
        if (error instanceof Error) {
            if (!error.message.includes(expectedMessage)) {
                throw new Error(`Expected error message to include "${expectedMessage}", got "${error.message}"`);
            }
        }
        else {
            throw new Error(`Expected error with message "${expectedMessage}", got ${String(error)}`);
        }
    }
}
//# sourceMappingURL=assertions.js.map