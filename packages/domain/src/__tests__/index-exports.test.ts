import { describe, expect, it } from "vitest";
import * as feos from "../feos";
import * as domain from "../index";
import * as workbench from "../workbench";

/**
 * `workbench` and `feos` both export these names. With two `export *` the name is
 * ambiguous and silently dropped, so consumers received `undefined` and crashed on
 * e.g. `DENSITY_MODE.COMFORTABLE`. The barrel now exports them explicitly: the
 * workbench variant (what the web app and the declared types use) under the plain
 * name and the FEOS variant under a FEOS_ alias.
 */
describe("@drenyra/domain barrel: names defined by both workbench and feos", () => {
	const shared = [
		"DENSITY_MODE",
		"PANE_POSITION",
		"PANE_TYPE",
		"WORKSPACE_INTENT",
		"createPeriodRef",
	] as const;

	it.each(shared)("%s is defined and is the workbench variant", (name) => {
		const value = (domain as Record<string, unknown>)[name];
		expect(value).toBeDefined();
		expect(value).toBe((workbench as Record<string, unknown>)[name]);
	});

	it("keeps the FEOS variants reachable under FEOS_ aliases", () => {
		const d = domain as Record<string, unknown>;
		expect(d.FEOS_DENSITY_MODE).toBe(feos.DENSITY_MODE);
		expect(d.FEOS_PANE_POSITION).toBe(feos.PANE_POSITION);
		expect(d.FEOS_PANE_TYPE).toBe(feos.PANE_TYPE);
		expect(d.FEOS_WORKSPACE_INTENT).toBe(feos.WORKSPACE_INTENT);
		expect(d.feosCreatePeriodRef).toBe(feos.createPeriodRef);
	});

	it("the two variants really differ where it matters (so the choice is meaningful)", () => {
		expect(domain.WORKSPACE_INTENT).not.toHaveProperty("AUDIT");
		expect(
			(domain as Record<string, Record<string, string>>).FEOS_WORKSPACE_INTENT,
		).toHaveProperty("AUDIT", "audit");
		expect(domain.PANE_TYPE).toHaveProperty("SIAR", "siar");
	});

	it("the workbench helpers work through the barrel (web usage)", () => {
		expect(domain.DENSITY_MODE.COMFORTABLE).toBe("comfortable");
		expect(domain.createPeriodRef(2026, 6)).toEqual({
			year: 2026,
			month: 6,
			label: "Junio 2026",
		});
	});

	it("the FEOS Workspace class (only defined in feos) is still exported", () => {
		expect(domain.Workspace).toBe(feos.Workspace);
		expect(typeof domain.Workspace.create).toBe("function");
	});
});
