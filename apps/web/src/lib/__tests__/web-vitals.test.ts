import { beforeEach, describe, expect, it, vi } from "vitest";
import { runtimeConfig } from "../runtime-config";

vi.mock("@sentry/react", () => ({
	captureException: vi.fn(),
	init: vi.fn(),
	reactErrorHandler: vi.fn(() => vi.fn()),
	replayIntegration: vi.fn(() => ({ name: "Replay" })),
	tanstackRouterBrowserTracingIntegration: vi.fn(() => ({
		name: "TanStackRouter",
	})),
}));

vi.mock("web-vitals", () => ({
	onCLS: vi.fn(),
	onINP: vi.fn(),
	onLCP: vi.fn(),
	onTTFB: vi.fn(),
}));

describe("initWebVitals", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		Object.assign(runtimeConfig, {
			monitoringEnabled: true,
			webVitalsEnabled: true,
		});

		// Ensure window has localStorage for the setup cleanup
		if (typeof window !== "undefined" && !window.localStorage) {
			Object.defineProperty(window, "localStorage", {
				value: { clear: vi.fn() },
				configurable: true,
				writable: true,
			});
			Object.defineProperty(window, "sessionStorage", {
				value: { clear: vi.fn() },
				configurable: true,
				writable: true,
			});
		}
	});

	it("registers all Core Web Vitals observers", async () => {
		const { onCLS, onINP, onLCP, onTTFB } = await import("web-vitals");
		const { __resetWebVitalsInit, initWebVitals } = await import(
			"../web-vitals"
		);
		__resetWebVitalsInit();

		initWebVitals();

		expect(onLCP).toHaveBeenCalledWith(expect.any(Function));
		expect(onCLS).toHaveBeenCalledWith(expect.any(Function));
		expect(onINP).toHaveBeenCalledWith(expect.any(Function));
		expect(onTTFB).toHaveBeenCalledWith(expect.any(Function));
	});

	it("is a no-op when monitoring is disabled", async () => {
		const { __resetWebVitalsInit, initWebVitals } = await import(
			"../web-vitals"
		);
		__resetWebVitalsInit();

		runtimeConfig.monitoringEnabled = false;
		const { onCLS } = await import("web-vitals");

		initWebVitals();
		expect(onCLS).not.toHaveBeenCalled();
	});

	it("is a no-op when web vitals are disabled", async () => {
		const { __resetWebVitalsInit, initWebVitals } = await import(
			"../web-vitals"
		);
		__resetWebVitalsInit();

		runtimeConfig.webVitalsEnabled = false;
		const { onCLS } = await import("web-vitals");

		initWebVitals();
		expect(onCLS).not.toHaveBeenCalled();
	});

	it("initializes only once", async () => {
		const { onLCP } = await import("web-vitals");
		const { __resetWebVitalsInit, initWebVitals } = await import(
			"../web-vitals"
		);
		__resetWebVitalsInit();

		initWebVitals();
		initWebVitals();

		expect(onLCP).toHaveBeenCalledTimes(1);
	});
});
