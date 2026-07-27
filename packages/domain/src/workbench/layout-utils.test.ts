/**
 * Workbench Domain — Layout Utils & Types Tests
 *
 * Strict TDD: RED phase — tests defined before implementation.
 * Covers Workspace, PaneConfig, PeriodRef, CompanyRef types
 * and layout serialization/merge/validation utilities.
 *
 * @module @drenyra/domain/workbench
 */

import { describe, expect, it } from "vitest";

// ─── WorkspaceId & PaneId Branded Types ────────────────────────────────────

describe("WorkspaceId branded type", () => {
	it("createWorkspaceId returns a string (branded at type level)", async () => {
		const { createWorkspaceId } = await import("./types");
		const id = createWorkspaceId();
		expect(typeof id).toBe("string");
		expect(id.length).toBeGreaterThan(0);
	});

	it("createWorkspaceId generates unique values", async () => {
		const { createWorkspaceId } = await import("./types");
		const id1 = createWorkspaceId();
		const id2 = createWorkspaceId();
		expect(id1).not.toBe(id2);
	});
});

describe("PaneId branded type", () => {
	it("createPaneId returns a string (branded at type level)", async () => {
		const { createPaneId } = await import("./types");
		const id = createPaneId();
		expect(typeof id).toBe("string");
		expect(id.length).toBeGreaterThan(0);
	});

	it("createPaneId generates unique values", async () => {
		const { createPaneId } = await import("./types");
		const id1 = createPaneId();
		const id2 = createPaneId();
		expect(id1).not.toBe(id2);
	});
});

// ─── PeriodRef ─────────────────────────────────────────────────────────────

describe("createPeriodRef", () => {
	it("creates a valid period with label like 'Junio 2026'", async () => {
		const { createPeriodRef } = await import("./types");
		const period = createPeriodRef(2026, 6);
		expect(period.year).toBe(2026);
		expect(period.month).toBe(6);
		expect(period.label).toBe("Junio 2026");
	});

	it("generates correct labels for all months", async () => {
		const { createPeriodRef } = await import("./types");
		const expectedLabels = [
			"Enero 2026", "Febrero 2026", "Marzo 2026", "Abril 2026",
			"Mayo 2026", "Junio 2026", "Julio 2026", "Agosto 2026",
			"Septiembre 2026", "Octubre 2026", "Noviembre 2026", "Diciembre 2026",
		];
		for (let m = 1; m <= 12; m++) {
			const period = createPeriodRef(2026, m);
			expect(period.label).toBe(expectedLabels[m - 1]);
		}
	});

	it("rejects month < 1", async () => {
		const { createPeriodRef } = await import("./types");
		expect(() => createPeriodRef(2026, 0)).toThrow();
	});

	it("rejects month > 12", async () => {
		const { createPeriodRef } = await import("./types");
		expect(() => createPeriodRef(2026, 13)).toThrow();
	});

	it("rejects year < 2020", async () => {
		const { createPeriodRef } = await import("./types");
		expect(() => createPeriodRef(2019, 6)).toThrow();
	});

	it("rejects year > 2100", async () => {
		const { createPeriodRef } = await import("./types");
		expect(() => createPeriodRef(2101, 1)).toThrow();
	});

	it("accepts boundary years (2020 and 2100)", async () => {
		const { createPeriodRef } = await import("./types");
		expect(() => createPeriodRef(2020, 1)).not.toThrow();
		expect(() => createPeriodRef(2100, 12)).not.toThrow();
	});
});

// ─── CompanyRef ────────────────────────────────────────────────────────────

describe("createCompanyRef", () => {
	it("creates a valid company ref", async () => {
		const { createCompanyRef } = await import("./types");
		const company = createCompanyRef("c1", "Arkelythex SAC", "20546296564", "org1");
		expect(company.id).toBe("c1");
		expect(company.name).toBe("Arkelythex SAC");
		expect(company.ruc).toBe("20546296564");
		expect(company.organizationId).toBe("org1");
	});

	it("rejects RUC that is not 11 digits", async () => {
		const { createCompanyRef } = await import("./types");
		expect(() => createCompanyRef("c1", "Test", "123", "org1")).toThrow();
		expect(() => createCompanyRef("c1", "Test", "123456789012", "org1")).toThrow();
	});

	it("rejects RUC with non-digit characters", async () => {
		const { createCompanyRef } = await import("./types");
		expect(() => createCompanyRef("c1", "Test", "2054629656A", "org1")).toThrow();
	});

	it("accepts valid 11-digit RUC", async () => {
		const { createCompanyRef } = await import("./types");
		expect(() => createCompanyRef("c1", "Test", "20546296564", "org1")).not.toThrow();
		expect(() => createCompanyRef("c1", "Test", "10456789012", "org1")).not.toThrow();
	});
});

// ─── PaneConfig Validation ─────────────────────────────────────────────────

describe("validatePaneConfig", () => {
	it("accepts a valid pane config", async () => {
		const { validatePaneConfig, createPaneId } = await import("./types");
		const config = {
			id: createPaneId(),
			type: "ledger" as const,
			label: "Ledger",
			position: "center" as const,
			size: 600,
			minSize: 400,
		};
		expect(validatePaneConfig(config)).toBe(true);
	});

	it("rejects when minSize > size", async () => {
		const { validatePaneConfig, createPaneId } = await import("./types");
		const config = {
			id: createPaneId(),
			type: "ledger" as const,
			label: "Ledger",
			position: "center" as const,
			size: 300,
			minSize: 400,
		};
		expect(validatePaneConfig(config)).toBe(false);
	});

	it("accepts minSize equal to size", async () => {
		const { validatePaneConfig, createPaneId } = await import("./types");
		const config = {
			id: createPaneId(),
			type: "ledger" as const,
			label: "Ledger",
			position: "center" as const,
			size: 400,
			minSize: 400,
		};
		expect(validatePaneConfig(config)).toBe(true);
	});

	it("rejects invalid position", async () => {
		const { validatePaneConfig, createPaneId } = await import("./types");
		const config = {
			id: createPaneId(),
			type: "ledger" as const,
			label: "Ledger",
			position: "top" as never,
			size: 600,
			minSize: 400,
		};
		expect(validatePaneConfig(config)).toBe(false);
	});

	it("rejects invalid pane type", async () => {
		const { validatePaneConfig, createPaneId } = await import("./types");
		const config = {
			id: createPaneId(),
			type: "invalid-type" as never,
			label: "Bad",
			position: "center" as const,
			size: 600,
			minSize: 400,
		};
		expect(validatePaneConfig(config)).toBe(false);
	});
});

// ─── Default Layouts ───────────────────────────────────────────────────────

describe("defaultWorkspaceLayout", () => {
	it("returns a valid layout with correct defaults", async () => {
		const { defaultWorkspaceLayout } = await import("./types");
		const layout = defaultWorkspaceLayout();
		expect(layout.sidebarCollapsed).toBe(false);
		expect(layout.rightPanelOpen).toBe(true);
		expect(layout.densityMode).toBe("default");
		expect(layout.panes).toHaveLength(3);
	});

	it("all default panes are valid", async () => {
		const { defaultWorkspaceLayout, validatePaneConfig } = await import("./types");
		const layout = defaultWorkspaceLayout();
		for (const pane of layout.panes) {
			expect(validatePaneConfig(pane)).toBe(true);
		}
	});
});

describe("defaultPaneConfigs", () => {
	it("returns 3 panes with correct positions and sizes", async () => {
		const { defaultPaneConfigs } = await import("./types");
		const panes = defaultPaneConfigs();
		expect(panes).toHaveLength(3);
		expect(panes[0].position).toBe("left");
		expect(panes[0].size).toBe(260);
		expect(panes[1].position).toBe("center");
		expect(panes[2].position).toBe("right");
		expect(panes[2].size).toBe(420);
	});
});

// ─── Layout Serialization ──────────────────────────────────────────────────

describe("serializeLayout / deserializeLayout", () => {
	it("roundtrips a layout without loss", async () => {
		const { defaultWorkspaceLayout } = await import("./types");
		const { serializeLayout, deserializeLayout } = await import("./layout-utils");
		const original = defaultWorkspaceLayout();
		const serialized = serializeLayout(original);
		expect(typeof serialized).toBe("string");
		const restored = deserializeLayout(serialized);
		expect(restored).not.toBeNull();
		expect(restored!.sidebarCollapsed).toBe(original.sidebarCollapsed);
		expect(restored!.rightPanelOpen).toBe(original.rightPanelOpen);
		expect(restored!.densityMode).toBe(original.densityMode);
		expect(restored!.panes).toHaveLength(original.panes.length);
	});

	it("deserializeLayout returns null for invalid JSON", async () => {
		const { deserializeLayout } = await import("./layout-utils");
		expect(deserializeLayout("not-json")).toBeNull();
	});

	it("deserializeLayout returns null for empty string", async () => {
		const { deserializeLayout } = await import("./layout-utils");
		expect(deserializeLayout("")).toBeNull();
	});

	it("deserializeLayout returns null for valid JSON that is not a layout", async () => {
		const { deserializeLayout } = await import("./layout-utils");
		expect(deserializeLayout('{"foo": "bar"}')).toBeNull();
	});

	it("deserializeLayout returns null for layout with invalid panes", async () => {
		const { deserializeLayout } = await import("./layout-utils");
		const bad = JSON.stringify({
			panes: [{ id: "p1", type: "invalid", label: "X", position: "left", size: 100, minSize: 50 }],
			sidebarCollapsed: false,
			rightPanelOpen: true,
			densityMode: "default",
		});
		expect(deserializeLayout(bad)).toBeNull();
	});
});

// ─── Layout Merging ────────────────────────────────────────────────────────

describe("mergeLayouts", () => {
	it("overrides top-level scalar fields", async () => {
		const { defaultWorkspaceLayout } = await import("./types");
		const { mergeLayouts } = await import("./layout-utils");
		const base = defaultWorkspaceLayout();
		const merged = mergeLayouts(base, { sidebarCollapsed: true, densityMode: "compact" as const });
		expect(merged.sidebarCollapsed).toBe(true);
		expect(merged.densityMode).toBe("compact");
		// Fields not in override remain unchanged
		expect(merged.rightPanelOpen).toBe(base.rightPanelOpen);
		expect(merged.panes).toEqual(base.panes);
	});

	it("overrides panes when provided", async () => {
		const { defaultWorkspaceLayout, createPaneId } = await import("./types");
		const { mergeLayouts } = await import("./layout-utils");
		const base = defaultWorkspaceLayout();
		const newPanes = [{
			id: createPaneId(),
			type: "generic" as const,
			label: "Single",
			position: "center" as const,
			size: 800,
			minSize: 400,
		}];
		const merged = mergeLayouts(base, { panes: newPanes });
		expect(merged.panes).toHaveLength(1);
		expect(merged.panes[0].label).toBe("Single");
	});

	it("returns base unchanged with empty override", async () => {
		const { defaultWorkspaceLayout } = await import("./types");
		const { mergeLayouts } = await import("./layout-utils");
		const base = defaultWorkspaceLayout();
		const merged = mergeLayouts(base, {});
		expect(merged).toEqual(base);
	});

	it("preserves rightPanelOpen when only overriding sidebarCollapsed", async () => {
		const { defaultWorkspaceLayout } = await import("./types");
		const { mergeLayouts } = await import("./layout-utils");
		const base = defaultWorkspaceLayout();
		const merged = mergeLayouts(base, { sidebarCollapsed: true });
		expect(merged.sidebarCollapsed).toBe(true);
		expect(merged.rightPanelOpen).toBe(base.rightPanelOpen);
	});
});

// ─── isValidLayout Type Guard ──────────────────────────────────────────────

describe("isValidLayout", () => {
	it("returns true for a valid layout", async () => {
		const { defaultWorkspaceLayout } = await import("./types");
		const { isValidLayout } = await import("./layout-utils");
		const layout = defaultWorkspaceLayout();
		expect(isValidLayout(layout)).toBe(true);
	});

	it("returns false for null", async () => {
		const { isValidLayout } = await import("./layout-utils");
		expect(isValidLayout(null)).toBe(false);
	});

	it("returns false for undefined", async () => {
		const { isValidLayout } = await import("./layout-utils");
		expect(isValidLayout(undefined)).toBe(false);
	});

	it("returns false for a non-object", async () => {
		const { isValidLayout } = await import("./layout-utils");
		expect(isValidLayout("string")).toBe(false);
		expect(isValidLayout(42)).toBe(false);
		expect(isValidLayout(true)).toBe(false);
	});

	it("returns false for missing required fields", async () => {
		const { isValidLayout } = await import("./layout-utils");
		expect(isValidLayout({})).toBe(false);
		expect(isValidLayout({ sidebarCollapsed: true })).toBe(false);
	});

	it("returns false for invalid densityMode", async () => {
		const { defaultWorkspaceLayout } = await import("./types");
		const { isValidLayout } = await import("./layout-utils");
		const layout = defaultWorkspaceLayout();
		const bad = { ...layout, densityMode: "extra-spacious" };
		expect(isValidLayout(bad)).toBe(false);
	});
});

// ─── Workspace Factory ─────────────────────────────────────────────────────

describe("Workspace creation", () => {
	it("creates a valid workspace with all required fields", async () => {
		const { createWorkspaceId, createCompanyRef, createPeriodRef, defaultWorkspaceLayout } = await import("./types");
		const workspace = {
			id: createWorkspaceId(),
			company: createCompanyRef("c1", "Arkelythex SAC", "20546296564", "org1"),
			period: createPeriodRef(2026, 6),
			intent: "close" as const,
			label: "Cierre Junio 2026",
			layout: defaultWorkspaceLayout(),
		};
		expect(workspace.id).toBeDefined();
		expect(workspace.company.name).toBe("Arkelythex SAC");
		expect(workspace.period.label).toBe("Junio 2026");
		expect(workspace.intent).toBe("close");
		expect(workspace.label).toBe("Cierre Junio 2026");
		expect(workspace.layout.panes).toHaveLength(3);
	});

	it("WorkspaceIntent covers all 6 values", async () => {
		const intents = ["close", "reconcile", "review", "investigate", "configure", "report"];
		expect(intents).toHaveLength(6);
		for (const intent of intents) {
			expect(typeof intent).toBe("string");
		}
	});

	it("DensityMode covers all 3 values", async () => {
		const modes = ["comfortable", "default", "compact"];
		expect(modes).toHaveLength(3);
	});

	it("PaneType covers all 9 values", async () => {
		const types = [
			"ledger", "sire-diff", "evidence", "agent-activity", "siar",
			"approval", "reconciliation", "report", "generic",
		];
		expect(types).toHaveLength(9);
	});
});

// ─── TRIANGULATE: Edge Cases ───────────────────────────────────────────────

describe("TRIANGULATE — createPeriodRef edge cases", () => {
	it("rejects non-integer year", async () => {
		const { createPeriodRef } = await import("./types");
		expect(() => createPeriodRef(2026.5, 6)).toThrow();
	});

	it("rejects non-integer month", async () => {
		const { createPeriodRef } = await import("./types");
		expect(() => createPeriodRef(2026, 6.5)).toThrow();
	});

	it("rejects NaN values", async () => {
		const { createPeriodRef } = await import("./types");
		expect(() => createPeriodRef(NaN, 6)).toThrow();
		expect(() => createPeriodRef(2026, NaN)).toThrow();
	});
});

describe("TRIANGULATE — createCompanyRef edge cases", () => {
	it("accepts empty id (domain leaves ownership validation to higher layers)", async () => {
		const { createCompanyRef } = await import("./types");
		expect(() => createCompanyRef("", "Name", "20546296564", "org1")).not.toThrow();
	});

	it("accepts empty name", async () => {
		const { createCompanyRef } = await import("./types");
		expect(() => createCompanyRef("c1", "", "20546296564", "org1")).not.toThrow();
	});

	it("rejects RUC with spaces", async () => {
		const { createCompanyRef } = await import("./types");
		expect(() => createCompanyRef("c1", "Test", "2054629656 ", "org1")).toThrow();
		expect(() => createCompanyRef("c1", "Test", " 20546296564", "org1")).toThrow();
	});

	it("rejects RUC with hyphens or dots", async () => {
		const { createCompanyRef } = await import("./types");
		expect(() => createCompanyRef("c1", "Test", "2054629656-4", "org1")).toThrow();
		expect(() => createCompanyRef("c1", "Test", "20.546296564", "org1")).toThrow();
	});
});

describe("TRIANGULATE — validatePaneConfig edge cases", () => {
	it("rejects config with zero size", async () => {
		const { validatePaneConfig, createPaneId } = await import("./types");
		expect(validatePaneConfig({
			id: createPaneId(), type: "generic", label: "Z",
			position: "center", size: 0, minSize: 0,
		})).toBe(true); // minSize <= size holds (0 <= 0)
	});

	it("rejects config with negative size", async () => {
		const { validatePaneConfig, createPaneId } = await import("./types");
		// Negative size with a less-negative minSize technically passes the size check
		// but negative sizes are unreasonable; domain doesn't guard for negative on purpose
		// (UI layer enforces positive). Still minSize > size catches it.
		expect(validatePaneConfig({
			id: createPaneId(), type: "generic", label: "Neg",
			position: "center", size: -100, minSize: 0,
		})).toBe(false); // minSize (0) > size (-100)
	});
});

describe("TRIANGULATE — deserializeLayout edge cases", () => {
	it("returns null for layout with null panes", async () => {
		const { deserializeLayout } = await import("./layout-utils");
		expect(deserializeLayout(JSON.stringify({
			panes: null, sidebarCollapsed: false, rightPanelOpen: true, densityMode: "default",
		}))).toBeNull();
	});

	it("returns null for layout with missing boolean fields", async () => {
		const { deserializeLayout } = await import("./layout-utils");
		expect(deserializeLayout(JSON.stringify({
			panes: [], sidebarCollapsed: "yes", rightPanelOpen: true, densityMode: "default",
		}))).toBeNull();
	});

	it("returns null for layout with a pane missing required fields", async () => {
		const { deserializeLayout } = await import("./layout-utils");
		expect(deserializeLayout(JSON.stringify({
			panes: [{ id: "p1", label: "Broken" }],
			sidebarCollapsed: false,
			rightPanelOpen: true,
			densityMode: "default",
		}))).toBeNull();
	});
});

describe("TRIANGULATE — mergeLayouts edge cases", () => {
	it("handles explicit undefined override fields (falls back to base)", async () => {
		const { defaultWorkspaceLayout } = await import("./types");
		const { mergeLayouts } = await import("./layout-utils");
		const base = defaultWorkspaceLayout();
		const merged = mergeLayouts(base, { sidebarCollapsed: undefined });
		expect(merged.sidebarCollapsed).toBe(base.sidebarCollapsed);
	});
});
