export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function randomFloat(min, max, decimals = 2) {
    const value = Math.random() * (max - min) + min;
    return Number(value.toFixed(decimals));
}
export function randomPick(arr) {
    if (arr.length === 0) {
        throw new Error("Cannot pick from empty array");
    }
    const index = randomInt(0, arr.length - 1);
    return arr[index];
}
export function randomString(length = 10) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length }, () => chars.charAt(randomInt(0, chars.length - 1))).join("");
}
export function randomEmail(domain = "test.pe") {
    return `user.${randomString(8)}@${domain}`;
}
export function randomPhone() {
    return `+51 9${randomInt(10000000, 99999999)}`;
}
export function randomRUC(type = "company") {
    const prefix = type === "company" ? "20" : "10";
    const base = prefix + randomString(8).replace(/[a-z]/g, "0").slice(0, 8);
    const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += Number(base[i] ?? "0") * (weights[i] ?? 0);
    }
    const remainder = sum % 11;
    let checkDigit = 11 - remainder;
    if (checkDigit === 10)
        checkDigit = 0;
    if (checkDigit === 11)
        checkDigit = 1;
    return base + checkDigit;
}
export function randomDNI() {
    return String(randomInt(10000000, 99999999));
}
export function randomId(prefix = "test") {
    return `${prefix}_${randomString(12)}`;
}
export function randomAccountCode(level = "4") {
    const lengths = {
        "1": 2,
        "2": 3,
        "3": 4,
        "4": 5,
        "5": 6,
    };
    const length = lengths[level] ?? 5;
    const firstDigit = randomInt(1, 9);
    const rest = randomString(length - 1).replace(/[a-z]/g, "0");
    return String(firstDigit) + rest.slice(0, length - 1);
}
export function seededRandom(seed) {
    let currentSeed = seed;
    function next() {
        currentSeed = (currentSeed * 1664525 + 1013904223) & 0xffffffff;
        return (currentSeed >>> 0) / 0xffffffff;
    }
    return {
        next,
        int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
        float: (min, max, decimals = 2) => Number((next() * (max - min) + min).toFixed(decimals)),
        pick: (arr) => arr[Math.floor(next() * arr.length)],
        string: (length = 10) => {
            const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
            return Array.from({ length }, () => chars.charAt(Math.floor(next() * chars.length))).join("");
        },
    };
}
//# sourceMappingURL=random.js.map