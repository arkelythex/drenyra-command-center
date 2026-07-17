import { beforeEach, describe, expect, it } from "vitest";
import { PlatformEventBus, PlatformEventTypes } from "../events";
import { CoreOrganizationSchema } from "../iam/schemas";
import { OntologyRegistry } from "../ontology/registry";
import { CoreClientSchema } from "../ontology/schemas";

/**
 * Cross-vertical integration test.
 *
 * Simulates the flow:
 * Drenyra (core) registers a Client → Andino (agricultura) reacts → Event bus delivers
 * across verticals via the shared PlatformEventBus and OntologyRegistry.
 */
describe("Cross-vertical Integration", () => {
	let eventBus: PlatformEventBus;
	let registry: OntologyRegistry;

	beforeEach(() => {
		eventBus = new PlatformEventBus();
		registry = new OntologyRegistry();

		// Register core types
		registry.register({
			name: "core.client",
			schema: CoreClientSchema,
			owner: "core",
			description: "A client/counterparty",
		});
		registry.register({
			name: "core.organization",
			schema: CoreOrganizationSchema,
			owner: "core",
			description: "Top-level tenant",
		});
	});

	it("Drenyra registers a Client → Andino receives event", async () => {
		const andinoReceived: Array<{ clientId: string; businessName: string }> =
			[];

		// Andino subscribes to client registration events
		await eventBus.subscribe(PlatformEventTypes.ClientRegistered, (event) => {
			andinoReceived.push({
				clientId: (event.payload as Record<string, unknown>).id as string,
				businessName: (event.payload as Record<string, unknown>)
					.businessName as string,
			});
		});

		// Drenyra publishes a client registration
		const clientData = {
			id: "client_test_1",
			organizationId: "org_test_1",
			documentType: "ruc" as const,
			documentNumber: "20123456789",
			businessName: "Agricola Los Andes SAC",
			isActive: true,
			tags: ["agricultura", "vip"],
			metadata: {},
			createdBy: "user_admin",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		// Validate before publishing
		const validated = CoreClientSchema.parse(clientData);
		await eventBus.publish(PlatformEventTypes.ClientRegistered, validated);

		// Andino should have received the event
		expect(andinoReceived).toHaveLength(1);
		expect(andinoReceived[0].clientId).toBe("client_test_1");
		expect(andinoReceived[0].businessName).toBe("Agricola Los Andes SAC");
	});

	it("OntologyRegistry manages types across verticals", () => {
		// Drenyra registers its types
		registry.register({
			name: "drenyra.invoice",
			schema: CoreClientSchema, // Simplified for test
			owner: "drenyra",
			description: "Fiscal invoice document",
		});

		// Andino registers its types
		registry.register({
			name: "andino.field-plot",
			schema: CoreClientSchema, // Simplified for test
			owner: "andino",
			description: "Agricultural field plot",
		});

		// OS lists all types in the system
		const allTypeNames = registry.list();
		expect(allTypeNames).toContain("core.client");
		expect(allTypeNames).toContain("core.organization");
		expect(allTypeNames).toContain("drenyra.invoice");
		expect(allTypeNames).toContain("andino.field-plot");
		expect(allTypeNames).toHaveLength(4);

		// Each vertical can query its own types (by owner)
		const drenyraTypes = registry
			.list()
			.filter((name) => name.startsWith("drenyra."));
		const andinoTypes = registry
			.list()
			.filter((name) => name.startsWith("andino."));
		const coreTypes = registry
			.list()
			.filter((name) => name.startsWith("core."));

		expect(coreTypes).toHaveLength(2);
		expect(drenyraTypes).toHaveLength(1);
		expect(andinoTypes).toHaveLength(1);
	});

	it("multiple verticals can subscribe to same event", async () => {
		const drenyraReceived: string[] = [];
		const andinoReceived: string[] = [];
		const adminReceived: string[] = [];

		// All verticals subscribe
		await eventBus.subscribe(PlatformEventTypes.OrganizationCreated, (e) => {
			drenyraReceived.push(
				(e.payload as Record<string, unknown>).businessName as string,
			);
		});
		await eventBus.subscribe(PlatformEventTypes.OrganizationCreated, (e) => {
			andinoReceived.push(
				(e.payload as Record<string, unknown>).businessName as string,
			);
		});
		await eventBus.subscribe(PlatformEventTypes.OrganizationCreated, (e) => {
			adminReceived.push(
				(e.payload as Record<string, unknown>).businessName as string,
			);
		});

		// Publish once
		await eventBus.publish(PlatformEventTypes.OrganizationCreated, {
			businessName: "ARKELYTHEX Corp",
		});

		// All three should have received it
		expect(drenyraReceived).toEqual(["ARKELYTHEX Corp"]);
		expect(andinoReceived).toEqual(["ARKELYTHEX Corp"]);
		expect(adminReceived).toEqual(["ARKELYTHEX Corp"]);
	});
});
