const SEVERITY_ORDER = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
};
export function compareSeverity(a, b) {
    return SEVERITY_ORDER[a] - SEVERITY_ORDER[b];
}
export function meetsThreshold(anomaly, threshold = "low") {
    return compareSeverity(anomaly.severity, threshold) >= 0;
}
//# sourceMappingURL=types.js.map