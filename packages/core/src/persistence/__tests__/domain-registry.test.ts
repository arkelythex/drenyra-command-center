import { describe, expect, it } from "vitest";
import { CoreDomainRegistry } from "../domain-registry";

describe("CoreDomainRegistry", () => {
	const registry = new CoreDomainRegistry();

	it("should register and list active domains", () => {
		registry.register({
			name: "drenyra",
			schemaName: "drenyra",
			displayName: "Contabilidad y Fiscal",
			isActive: true,
		});
		const domains = registry.getActiveDomains();
		expect(domains).toHaveLength(1);
		expect(domains[0].name).toBe("drenyra");
	});

	it("should not return inactive domains", () => {
		registry.register({
			name: "salud",
			schemaName: "salud",
			displayName: "Salud",
			isActive: false,
		});
		const domains = registry.getActiveDomains();
		expect(domains.find((d) => d.name === "salud")).toBeUndefined();
	});

	it("should check if a domain is registered", () => {
		expect(registry.isRegistered("drenyra")).toBe(true);
		expect(registry.isRegistered("nonexistent")).toBe(false);
	});
});
