import { describe, expect, it } from "vitest";
import { ACTION_ITEMS, NAV_TARGETS } from "../CommandPalette.data";

describe("CommandPalette — L3 fiscal references", () => {
	it("includes /cerrar-periodo as a navigable command", () => {
		const command = NAV_TARGETS.find((n) => n.id === "cerrar-periodo");
		expect(command).toBeDefined();
		expect(command!.description).toContain("/cerrar-periodo");
		expect(command!.path).toBe("/cierre-mensual");
	});

	it("includes /revisar-alerta as a navigable command", () => {
		const command = NAV_TARGETS.find((n) => n.id === "revisar-alerta");
		expect(command).toBeDefined();
		expect(command!.description).toContain("/revisar-alerta");
		expect(command!.path).toBe("/review-queue");
	});

	it("includes a navigation target for Cierre mensual", () => {
		const cierre = NAV_TARGETS.find((n) => n.id === "cierre-mensual");
		expect(cierre).toBeDefined();
	});

	it("includes Spanish action labels", () => {
		const threadAction = ACTION_ITEMS.find((a) => a.id === "new-thread");
		expect(threadAction?.label).toBe("Nueva conversación");
	});
});
