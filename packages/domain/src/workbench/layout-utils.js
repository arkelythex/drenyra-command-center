import { DENSITY_MODE, validatePaneConfig } from "./types";
export function serializeLayout(layout) {
    return JSON.stringify(layout);
}
export function deserializeLayout(data) {
    if (!data || data.trim().length === 0)
        return null;
    let parsed;
    try {
        parsed = JSON.parse(data);
    }
    catch {
        return null;
    }
    if (!isValidLayout(parsed))
        return null;
    return parsed;
}
export function mergeLayouts(base, override) {
    return {
        panes: override.panes ?? base.panes,
        sidebarCollapsed: override.sidebarCollapsed ?? base.sidebarCollapsed,
        rightPanelOpen: override.rightPanelOpen ?? base.rightPanelOpen,
        densityMode: override.densityMode ?? base.densityMode,
    };
}
const VALID_DENSITY_MODES = new Set(Object.values(DENSITY_MODE));
export function isValidLayout(value) {
    if (typeof value !== "object" || value === null)
        return false;
    const candidate = value;
    if (!Array.isArray(candidate["panes"]))
        return false;
    for (const pane of candidate["panes"]) {
        if (!validatePaneConfig(pane))
            return false;
    }
    if (typeof candidate["sidebarCollapsed"] !== "boolean")
        return false;
    if (typeof candidate["rightPanelOpen"] !== "boolean")
        return false;
    if (!VALID_DENSITY_MODES.has(candidate["densityMode"]))
        return false;
    return true;
}
//# sourceMappingURL=layout-utils.js.map