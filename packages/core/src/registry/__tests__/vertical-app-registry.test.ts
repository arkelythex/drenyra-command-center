import { beforeEach, describe, expect, it } from "vitest";
import {
	type VerticalAppManifest,
	VerticalAppRegistry,
} from "../vertical-app-registry.js";

const drenyraManifest: VerticalAppManifest = {
	id: "drenyra",
	name: "Drenyra",
	description: "Infraestructura Nacional de Inteligencia Fiscal",
	icon: "Landmark",
	routePrefix: "/",
	remoteEntry: null,
	navPriority: 1,
	navItems: [
		{ label: "Dashboard", path: "/", icon: "LayoutDashboard" },
		{ label: "Facturación", path: "/invoices", icon: "FileText" },
	],
};

const adminManifest: VerticalAppManifest = {
	id: "admin",
	name: "Administración",
	description: "Gestión de empleados y RRHH",
	icon: "Building2",
	routePrefix: "/admin",
	remoteEntry: "http://localhost:5174/remoteEntry.js",
	navPriority: 10,
	navItems: [
		{ label: "Empleados", path: "/admin/employees", icon: "Users" },
		{ label: "Contratos", path: "/admin/contracts", icon: "FileSignature" },
	],
};

describe("VerticalAppRegistry", () => {
	let registry: VerticalAppRegistry;

	beforeEach(() => {
		registry = new VerticalAppRegistry();
	});

	it("registers and retrieves a vertical app", () => {
		registry.register(drenyraManifest);
		expect(registry.get("drenyra")).toEqual(drenyraManifest);
	});

	it("lists apps sorted by navPriority", () => {
		registry.registerAll([adminManifest, drenyraManifest]);
		const list = registry.list();
		expect(list[0].id).toBe("drenyra");
		expect(list[1].id).toBe("admin");
	});

	it("throws on duplicate registration", () => {
		registry.register(drenyraManifest);
		expect(() => registry.register(drenyraManifest)).toThrow(
			'Vertical app "drenyra" already registered',
		);
	});

	it("getNavigation returns flat nav items sorted by app priority", () => {
		registry.registerAll([adminManifest, drenyraManifest]);
		const nav = registry.getNavigation();
		expect(nav).toHaveLength(4);
		expect(nav[0].path).toBe("/");
		expect(nav[2].path).toBe("/admin/employees");
	});

	it("has returns true for registered app", () => {
		registry.register(drenyraManifest);
		expect(registry.has("drenyra")).toBe(true);
		expect(registry.has("admin")).toBe(false);
	});

	it("returns empty list when no apps registered", () => {
		expect(registry.list()).toEqual([]);
		expect(registry.getNavigation()).toEqual([]);
	});
});
