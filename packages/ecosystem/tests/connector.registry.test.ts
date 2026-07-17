import { beforeEach, describe, expect, it } from "vitest";
import { BaseConnector } from "../src/base.connector";
import {
	type ConnectorRegistry,
	getConnectorRegistry,
	resetConnectorRegistry,
} from "../src/connector.registry";

class TestConnector extends BaseConnector {
	readonly name = "test";
	readonly config = { test: true };
	private _connected = false;

	async connect(): Promise<void> {
		this.state = "connected";
		this._connected = true;
	}
	async disconnect(): Promise<void> {
		this.state = "disconnected";
		this._connected = false;
	}
	async execute<TResult>(_op: string): Promise<TResult> {
		return this.guardedExecute(async () => {
			if (!this._connected) throw new Error("Not connected");
			return { ok: true } as TResult;
		});
	}
}

describe("ConnectorRegistry", () => {
	let registry: ConnectorRegistry;

	beforeEach(() => {
		resetConnectorRegistry();
		registry = getConnectorRegistry();
	});

	it("registers a connector", () => {
		const connector = new TestConnector();
		registry.register(connector);
		expect(registry.size()).toBe(1);
		expect(registry.getNames()).toContain("test");
	});

	it("throws on duplicate registration", () => {
		registry.register(new TestConnector());
		expect(() => registry.register(new TestConnector())).toThrow(
			"already registered",
		);
	});

	it("unregisters a connector", () => {
		const connector = new TestConnector();
		registry.register(connector);
		registry.unregister("test");
		expect(registry.size()).toBe(0);
	});

	it("connects all registered connectors", async () => {
		registry.register(new TestConnector());
		await registry.connectAll();
		const connector = registry.get<TestConnector>("test")!;
		expect(connector).toBeDefined();
		const health = await connector.isHealthy();
		expect(health.connected).toBe(true);
	});

	it("returns empty health for empty registry", async () => {
		const health = await registry.healthCheck();
		expect(Object.keys(health)).toHaveLength(0);
	});

	it("tracks metrics", () => {
		const connector = new TestConnector();
		registry.register(connector);
		registry.recordOperation("test", false);
		registry.recordOperation("test", false);
		registry.recordOperation("test", true);
		const metrics = registry.getMetrics();
		expect(metrics).toHaveLength(1);
		expect(metrics[0].operationsTotal).toBe(3);
		expect(metrics[0].errorsTotal).toBe(1);
	});
});
