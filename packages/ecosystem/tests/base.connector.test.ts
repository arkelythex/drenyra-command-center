import { describe, expect, it } from "vitest";
import { BaseConnector, CircuitBreakerOpenError } from "../src/base.connector";

class FailingConnector extends BaseConnector {
	readonly name = "failing";
	readonly config = {};
	private failCount = 0;

	async connect(): Promise<void> {
		this.state = "connected";
	}
	async disconnect(): Promise<void> {
		this.state = "disconnected";
	}

	setFailCount(count: number) {
		this.failCount = count;
	}

	async execute<TResult>(_op: string): Promise<TResult> {
		return this.guardedExecute(async () => {
			if (this.failCount > 0) {
				this.failCount--;
				throw new Error("Simulated failure");
			}
			return { ok: true } as TResult;
		});
	}

	async performHealthCheck(): Promise<boolean> {
		return this.state === "connected";
	}
}

describe("BaseConnector", () => {
	it("connects and reports healthy", async () => {
		const c = new FailingConnector();
		await c.connect();
		const health = await c.isHealthy();
		expect(health.connected).toBe(true);
	});

	it("disconnects and reports unhealthy", async () => {
		const c = new FailingConnector();
		await c.connect();
		await c.disconnect();
		const health = await c.isHealthy();
		expect(health.connected).toBe(false);
	});

	it("executes successfully when no failures", async () => {
		const c = new FailingConnector();
		await c.connect();
		const result = await c.execute<{ ok: boolean }>("test");
		expect(result.ok).toBe(true);
	});

	it("opens circuit breaker after threshold failures", async () => {
		const c = new FailingConnector();
		await c.connect();
		c.setFailCount(10);

		// The first 4 calls throw "Simulated failure" — auto-retry
		// accelerates the failure accumulation (2 failures on first call,
		// 1 per subsequent call), reaching threshold of 5 by call 4.
		for (let i = 0; i < 4; i++) {
			await expect(c.execute("test")).rejects.toThrow("Simulated failure");
		}

		// 5th call — circuit is OPEN, checkAndRecover can't recover in time
		await expect(c.execute("test")).rejects.toThrow(CircuitBreakerOpenError);
	});

	it("tracks metrics", async () => {
		const c = new FailingConnector();
		await c.connect();
		await c.execute<{ ok: boolean }>("test").catch(() => {});
		const metrics = c.getMetrics();
		expect(metrics.state).toBe("connected");
		expect(metrics.operationsTotal).toBe(1);
		expect(metrics.errorsTotal).toBe(0);
	});

	it("returns health with latency", async () => {
		const c = new FailingConnector();
		await c.connect();
		const health = await c.isHealthy();
		expect(health.latencyMs).toBeGreaterThanOrEqual(0);
		expect(typeof health.lastChecked).toBe("string");
	});

	describe("exponential backoff", () => {
		it("doubles recovery delay on each failed attempt", () => {
			const c = new FailingConnector();
			const connector = c as unknown as {
				currentRecoveryMs: number;
				recoveryAttempts: number;
				baseRecoveryMs: number;
				maxRecoveryMs: number;
			};

			expect(connector.currentRecoveryMs).toBe(10_000);

			connector.recoveryAttempts = 1;
			expect(connector.currentRecoveryMs).toBe(20_000);

			connector.recoveryAttempts = 2;
			expect(connector.currentRecoveryMs).toBe(40_000);

			connector.recoveryAttempts = 3;
			expect(connector.currentRecoveryMs).toBe(80_000);
		});

		it("caps recovery delay at maxRecoveryMs", () => {
			const c = new FailingConnector();
			const connector = c as unknown as {
				currentRecoveryMs: number;
				recoveryAttempts: number;
				maxRecoveryMs: number;
			};

			connector.recoveryAttempts = 5;
			expect(connector.currentRecoveryMs).toBe(300_000);

			connector.recoveryAttempts = 10;
			expect(connector.currentRecoveryMs).toBe(300_000);
		});
	});

	describe("health-driven auto-recovery", () => {
		it("closes circuit when health check passes after backoff", async () => {
			const c = new FailingConnector();
			await c.connect();

			// Open the circuit
			c.setFailCount(5);
			for (let i = 0; i < 5; i++) {
				await c.execute("test").catch(() => {});
			}
			expect(c.getMetrics().circuitBreakerState).toBe("open");

			// Simulate backoff time passing
			(c as unknown as { lastFailureTime: number }).lastFailureTime =
				Date.now() - 20_000;

			// isHealthy should trigger checkAndRecover
			await c.isHealthy();
			expect(c.getMetrics().circuitBreakerState).toBe("closed");
		});

		it("increments recoveryAttempts when health check fails after backoff", async () => {
			const c = new FailingConnector();
			await c.connect();

			c.setFailCount(5);
			for (let i = 0; i < 5; i++) {
				await c.execute("test").catch(() => {});
			}
			expect(c.getMetrics().circuitBreakerState).toBe("open");

			// Disconnect so health check fails
			await c.disconnect();

			// Simulate backoff time passing
			(c as unknown as { lastFailureTime: number }).lastFailureTime =
				Date.now() - 20_000;

			// Execute triggers checkAndRecover → half-open → fail → back to open
			await expect(c.execute("test")).rejects.toThrow(CircuitBreakerOpenError);
			expect(c.getMetrics().circuitBreakerState).toBe("open");
			expect(
				(c as unknown as { recoveryAttempts: number }).recoveryAttempts,
			).toBe(1);

			// With recoveryAttempts=1, currentRecoveryMs=20000
			// Advance only 15000 — NOT enough
			(c as unknown as { lastFailureTime: number }).lastFailureTime =
				Date.now() - 15_000;
			await expect(c.execute("test")).rejects.toThrow(CircuitBreakerOpenError);

			// Advance 25000 — enough for 20000 delay
			(c as unknown as { lastFailureTime: number }).lastFailureTime =
				Date.now() - 25_000;
			await expect(c.execute("test")).rejects.toThrow(CircuitBreakerOpenError);
			expect(
				(c as unknown as { recoveryAttempts: number }).recoveryAttempts,
			).toBe(2);
		});
	});

	describe("auto-retry on transient error", () => {
		it("succeeds after auto-retry when transient failure resolves", async () => {
			const c = new FailingConnector();
			await c.connect();
			c.setFailCount(1);

			const result = await c.execute<{ ok: boolean }>("test");
			expect(result.ok).toBe(true);
			// First attempt failed (counted in errors), retry succeeded
			expect(c.getMetrics().operationsTotal).toBe(1);
			expect(c.getMetrics().errorsTotal).toBe(1);
		});

		it("throws after exhausting auto-retry on persistent failure", async () => {
			const c = new FailingConnector();
			await c.connect();
			c.setFailCount(2);

			await expect(c.execute("test")).rejects.toThrow("Simulated failure");
			// Both attempts (initial + retry) failed
			expect(c.getMetrics().operationsTotal).toBe(0);
			expect(c.getMetrics().errorsTotal).toBe(2);
		});
	});

	describe("resetMetrics", () => {
		it("clears all runtime counters and closes circuit", async () => {
			const c = new FailingConnector();
			await c.connect();
			c.setFailCount(5);

			for (let i = 0; i < 5; i++) {
				await c.execute("test").catch(() => {});
			}
			// Verify circuit is open with failures
			expect(c.getMetrics().circuitBreakerState).toBe("open");
			expect(c.getMetrics().errorsTotal).toBeGreaterThan(0);

			c.resetMetrics();

			const metrics = c.getMetrics();
			expect(metrics.operationsTotal).toBe(0);
			expect(metrics.errorsTotal).toBe(0);
			expect(metrics.circuitBreakerState).toBe("closed");
			expect(metrics.lastOperationAt).toBeNull();
			// Connection state is NOT reset by resetMetrics
			expect(metrics.state).toBe("connected");
		});
	});
});
