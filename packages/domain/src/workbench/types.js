export const WORKSPACE_INTENT = {
    CLOSE: "close",
    RECONCILE: "reconcile",
    REVIEW: "review",
    INVESTIGATE: "investigate",
    CONFIGURE: "configure",
    REPORT: "report",
};
export const DENSITY_MODE = {
    COMFORTABLE: "comfortable",
    DEFAULT: "default",
    COMPACT: "compact",
};
export const PANE_TYPE = {
    LEDGER: "ledger",
    SIRE_DIFF: "sire-diff",
    EVIDENCE: "evidence",
    AGENT_ACTIVITY: "agent-activity",
    SIAR: "siar",
    APPROVAL: "approval",
    RECONCILIATION: "reconciliation",
    REPORT: "report",
    GENERIC: "generic",
};
export const PANE_POSITION = {
    LEFT: "left",
    CENTER: "center",
    RIGHT: "right",
};
const MONTH_LABELS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
let _workspaceIdCounter = 0;
let _paneIdCounter = 0;
export function createWorkspaceId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    _workspaceIdCounter += 1;
    return `ws-${Date.now()}-${_workspaceIdCounter}`;
}
export function createPaneId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    _paneIdCounter += 1;
    return `pane-${Date.now()}-${_paneIdCounter}`;
}
export function createPeriodRef(year, month) {
    if (!Number.isInteger(year) || year < 2020 || year > 2100) {
        throw new Error(`Invalid year: ${year}. Must be an integer between 2020 and 2100.`);
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new Error(`Invalid month: ${month}. Must be an integer between 1 and 12.`);
    }
    const label = `${MONTH_LABELS[month - 1]} ${year}`;
    return { year, month, label };
}
const RUC_PATTERN = /^\d{11}$/;
export function createCompanyRef(id, name, ruc, organizationId) {
    if (!RUC_PATTERN.test(ruc)) {
        throw new Error(`Invalid RUC: "${ruc}". Must be exactly 11 digits (0-9).`);
    }
    return { id, name, ruc, organizationId };
}
const VALID_POSITIONS = new Set([PANE_POSITION.LEFT, PANE_POSITION.CENTER, PANE_POSITION.RIGHT]);
const VALID_PANE_TYPES = new Set(Object.values(PANE_TYPE));
export function validatePaneConfig(config) {
    if (!VALID_POSITIONS.has(config.position))
        return false;
    if (!VALID_PANE_TYPES.has(config.type))
        return false;
    if (config.minSize > config.size)
        return false;
    return true;
}
export function defaultPaneConfigs() {
    return [
        {
            id: createPaneId(),
            type: PANE_TYPE.GENERIC,
            label: "Sidebar",
            position: PANE_POSITION.LEFT,
            size: 260,
            minSize: 64,
        },
        {
            id: createPaneId(),
            type: PANE_TYPE.GENERIC,
            label: "Main",
            position: PANE_POSITION.CENTER,
            size: 600,
            minSize: 400,
        },
        {
            id: createPaneId(),
            type: PANE_TYPE.GENERIC,
            label: "Right Panel",
            position: PANE_POSITION.RIGHT,
            size: 420,
            minSize: 300,
        },
    ];
}
export function defaultWorkspaceLayout() {
    return {
        panes: defaultPaneConfigs(),
        sidebarCollapsed: false,
        rightPanelOpen: true,
        densityMode: DENSITY_MODE.DEFAULT,
    };
}
//# sourceMappingURL=types.js.map