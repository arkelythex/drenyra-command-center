/**
 * Fault Isolation Tests
 *
 * HARMONY-001: Verify module isolation works correctly
 */

import { beforeEach, describe, expect, it } from "bun:test";
import {
	executeWithIsolation,
	getAllModuleHealth,
	getFailedModules,
	getModuleHealth,
	isSystemDegraded,
	registerModule,
	resetModuleHealth,
} from "../fault-isolation-guard";

describe("HARMONY-001: Fault Isolation", () => {
	beforeEach(() => {
		// Reset all modules for clean tests
		for (const health of getAllModuleHealth()) {
			resetModuleHealth(health.name);
		}
	});

	describe("Module Registration", () => {
		it("should register a critical module", () => {
			registerModule({
				name: "auth",
				priority: "critical",
			});

			const health = getModuleHealth("auth");
			expect(health).toBeDefined();
			expect(health?.status).toBe("healthy");
		});

		it("should register a non-critical module with fallback", () => {
			registerModule({
				name: "pdf-generator",
				priority: "non-critical",
				fallbackValue: null,
			});

			const health = getModuleHealth("pdf-generator");
			expect(health?.status).toBe("healthy");
		});
	});

	describe("Successful Execution", () => {
		it("should execute and return value on success", async () => {
			registerModule({ name: "test-success", priority: "standard" });

			const result = await executeWithIsolation("test-success", async () => {
				return "success";
			});

			expect(result.success).toBe(true);
			expect(result.value).toBe("success");
			expect(result.usedFallback).toBe(false);
		});

		it("should track execution time", async () => {
			registerModule({ name: "test-timing", priority: "standard" });

			const result = await executeWithIsolation("test-timing", async () => {
				await new Promise((r) => setTimeout(r, 10));
				return true;
			});

			expect(result.executionTimeMs).toBeGreaterThan(5);
		});
	});

	describe("Fault Isolation - Non-critical Modules", () => {
		it("should return fallback when non-critical module fails", async () => {
			registerModule({
				name: "email-service",
				priority: "non-critical",
				fallbackValue: { sent: false, reason: "service unavailable" },
				maxRetries: 0,
			});

			const result = await executeWithIsolation("email-service", async () => {
				throw new Error("SMTP connection failed");
			});

			expect(result.success).toBe(false);
			expect(result.usedFallback).toBe(true);
			expect(result.value as { sent: boolean; reason: string }).toEqual({
				sent: false,
				reason: "service unavailable",
			});
		});

		it("should mark non-critical module as degraded on failure", async () => {
			registerModule({
				name: "analytics",
				priority: "non-critical",
				fallbackValue: [],
				maxRetries: 0,
			});

			await executeWithIsolation("analytics", async () => {
				throw new Error("Analytics service down");
			});

			const health = getModuleHealth("analytics");
			expect(health?.status).toBe("degraded");
			expect(health?.failureCount).toBe(1);
		});
	});

	describe("Fault Isolation - Critical Modules", () => {
		it("should not use fallback for critical modules", async () => {
			registerModule({
				name: "ledger",
				priority: "critical",
			});

			const result = await executeWithIsolation("ledger", async () => {
				throw new Error("Database connection lost");
			});

			expect(result.success).toBe(false);
			expect(result.usedFallback).toBe(false);
			expect(result.error?.message).toBe("Database connection lost");
		});

		it("should mark critical module as failed", async () => {
			registerModule({
				name: "auth-critical",
				priority: "critical",
			});

			await executeWithIsolation("auth-critical", async () => {
				throw new Error("Auth service down");
			});

			const health = getModuleHealth("auth-critical");
			expect(health?.status).toBe("failed");
		});
	});

	describe("System Health", () => {
		it("should detect system degradation", async () => {
			registerModule({
				name: "healthy-module",
				priority: "standard",
			});

			registerModule({
				name: "failing-module",
				priority: "non-critical",
				fallbackValue: null,
				maxRetries: 0,
			});

			await executeWithIsolation("failing-module", async () => {
				throw new Error("Failed");
			});

			expect(isSystemDegraded()).toBe(true);
		});

		it("should list failed modules", async () => {
			registerModule({
				name: "failing-critical",
				priority: "critical",
			});

			await executeWithIsolation("failing-critical", async () => {
				throw new Error("Critical failure");
			});

			const failed = getFailedModules();
			expect(failed).toContain("failing-critical");
		});
	});
});
