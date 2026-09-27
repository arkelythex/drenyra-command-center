import { generateId, nowTimestamp } from "./types";
export const PANE_TYPE = {
    LEDGER: "ledger",
    SIRE: "sire",
    SIRE_DIFF: "sire-diff",
    EVIDENCE: "evidence",
    AGENT_ACTIVITY: "agent-activity",
    APPROVAL: "approval",
    RECONCILIATION: "reconciliation",
    REPORT: "report",
    SKILLS: "skills",
    AUTOMATIONS: "automations",
    ATTENTION: "attention",
    TIMELINE: "timeline",
    DIFF: "diff",
    GENERIC: "generic",
};
export const PANE_POSITION = { LEFT: "left", CENTER: "center", RIGHT: "right", BOTTOM: "bottom" };
export const DENSITY_MODE = { COMFORTABLE: "comfortable", DEFAULT: "default", COMPACT: "compact" };
export class Layout {
    props;
    constructor(props) {
        this.props = props;
        Object.freeze(this);
    }
    static create(input) {
        return new Layout({
            id: generateId(),
            name: input.name,
            panes: input.panes ?? defaultPanes(),
            sidebarCollapsed: false,
            rightPanelOpen: true,
            densityMode: "default",
            isTemplate: input.isTemplate ?? false,
            workspaceId: input.workspaceId,
            createdAt: nowTimestamp(),
            updatedAt: nowTimestamp(),
        });
    }
    static fromProps(props) {
        return new Layout(props);
    }
    get id() { return this.props.id; }
    get panes() { return this.props.panes; }
    get densityMode() { return this.props.densityMode; }
    setDensity(mode) {
        return new Layout({ ...this.props, densityMode: mode, updatedAt: nowTimestamp() });
    }
    addPane(pane) {
        return new Layout({ ...this.props, panes: [...this.props.panes, pane], updatedAt: nowTimestamp() });
    }
    removePane(paneId) {
        return new Layout({ ...this.props, panes: this.props.panes.filter((p) => p.id !== paneId), updatedAt: nowTimestamp() });
    }
    resizePane(paneId, newSize) {
        return new Layout({
            ...this.props,
            panes: this.props.panes.map((p) => p.id === paneId ? { ...p, size: newSize } : p),
            updatedAt: nowTimestamp(),
        });
    }
    toggleSidebar() {
        return new Layout({ ...this.props, sidebarCollapsed: !this.props.sidebarCollapsed, updatedAt: nowTimestamp() });
    }
    toProps() {
        return { ...this.props };
    }
    serialize() {
        return JSON.stringify(this.props);
    }
    static deserialize(data) {
        return Layout.fromProps(JSON.parse(data));
    }
}
export function defaultPanes() {
    return [
        { id: generateId(), type: "generic", label: "Sidebar", position: "left", size: 260, minSize: 64, resizable: true, closable: false },
        { id: generateId(), type: "generic", label: "Main", position: "center", size: 600, minSize: 400, resizable: true, closable: false },
        { id: generateId(), type: "generic", label: "Right Panel", position: "right", size: 420, minSize: 300, resizable: true, closable: true },
    ];
}
export function layoutTemplates() {
    return [
        Layout.create({ name: "Monthly Close", isTemplate: true, panes: [
                { id: generateId(), type: "ledger", label: "Ledger", position: "left", size: 300, minSize: 200, resizable: true, closable: false },
                { id: generateId(), type: "generic", label: "Close Checklist", position: "center", size: 600, minSize: 400, resizable: true, closable: false },
                { id: generateId(), type: "approval", label: "Approvals", position: "right", size: 420, minSize: 300, resizable: true, closable: true },
                { id: generateId(), type: "attention", label: "Attention", position: "bottom", size: 200, minSize: 100, resizable: true, closable: true },
            ] }).toProps(),
        Layout.create({ name: "SIRE Review", isTemplate: true, panes: [
                { id: generateId(), type: "sire", label: "SIRE Books", position: "left", size: 300, minSize: 200, resizable: true, closable: false },
                { id: generateId(), type: "sire-diff", label: "SIRE Diff", position: "center", size: 600, minSize: 400, resizable: true, closable: false },
                { id: generateId(), type: "evidence", label: "Evidence", position: "right", size: 420, minSize: 300, resizable: true, closable: true },
            ] }).toProps(),
        Layout.create({ name: "Bank Reconciliation", isTemplate: true, panes: [
                { id: generateId(), type: "reconciliation", label: "Reconciliation", position: "center", size: 800, minSize: 400, resizable: true, closable: false },
                { id: generateId(), type: "evidence", label: "Documents", position: "right", size: 400, minSize: 300, resizable: true, closable: true },
            ] }).toProps(),
    ];
}
//# sourceMappingURL=pane-runtime.js.map