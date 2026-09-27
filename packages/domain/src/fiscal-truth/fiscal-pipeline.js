export const FISCAL_ACTION_STATUS = {
    DETECTED: "DETECTED",
    ANALYZED: "ANALYZED",
    PROPOSED: "PROPOSED",
    VALIDATED: "VALIDATED",
    APPROVED: "APPROVED",
    EXECUTED: "EXECUTED",
    EVIDENCED: "EVIDENCED",
    REJECTED: "REJECTED",
};
export const FISCAL_ACTION_STATUS_LABELS = {
    DETECTED: "Detectado",
    ANALYZED: "Analizado",
    PROPOSED: "Propuesto",
    VALIDATED: "Validado",
    APPROVED: "Aprobado",
    EXECUTED: "Ejecutado",
    EVIDENCED: "Evidenciado",
    REJECTED: "Rechazado",
};
export const FISCAL_ACTION_STATUS_ORDER = [
    "DETECTED",
    "ANALYZED",
    "PROPOSED",
    "VALIDATED",
    "APPROVED",
    "EXECUTED",
    "EVIDENCED",
];
export function canAutoApprove(riskLevel) {
    return riskLevel === "LOW";
}
export function requiresDualSignature(riskLevel) {
    return riskLevel === "HIGH" || riskLevel === "CRITICAL";
}
export function nextStatus(current) {
    const idx = FISCAL_ACTION_STATUS_ORDER.indexOf(current);
    if (idx === -1 || idx >= FISCAL_ACTION_STATUS_ORDER.length - 1)
        return null;
    return FISCAL_ACTION_STATUS_ORDER[idx + 1];
}
export const FISCAL_RISK_COLORS = {
    LOW: "var(--color-success)",
    MEDIUM: "var(--color-warning)",
    HIGH: "var(--color-danger)",
    CRITICAL: "var(--color-danger)",
};
export const FISCAL_ACTION_STATUS_COLORS = {
    DETECTED: "var(--color-text-muted)",
    ANALYZED: "var(--color-info)",
    PROPOSED: "var(--color-info)",
    VALIDATED: "var(--color-info)",
    APPROVED: "var(--color-success)",
    EXECUTED: "var(--color-success)",
    EVIDENCED: "var(--color-success)",
    REJECTED: "var(--color-danger)",
};
//# sourceMappingURL=fiscal-pipeline.js.map