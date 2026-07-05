import { beforeEach, describe, expect, it, vi } from "vitest";
import { runtimeConfig } from "../runtime-config";

const mockRouter = {
	navigate: vi.fn(),
	state: { location: { pathname: "/test" } },
} as unknown as import("@tanstack/react-router").Router<
	unknown,
	unknown,
	unknown
>;

vi.mock("@sentry/react", () => ({
	init: vi.fn(),
	reactErrorHandler: vi.fn(() => {
		const handler = () => {};
		return handler;
	}),
	replayIntegration: vi.fn(() => ({ name: "Replay" })),
	tanstackRouterBrowserTracingIntegration: vi.fn(() => ({
		name: "TanStackRouter",
	})),
}));

describe("initSentry", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		Object.assign(runtimeConfig, {
			monitoringEnabled: true,
			sentryDsn: "https://public@example.com/1",
			sentryEnvironment: "test",
			sentryTracesSampleRate: 0.2,
			sentryReplaysSessionSampleRate: 0.1,
			sentryReplaysOnErrorSampleRate: 1,
		});
	});

	it("initializes Sentry with the router integration", async () => {
		const sentry = await import("@sentry/react");
		const { initSentry } = await import("../sentry");

		const result = initSentry(mockRouter);

		expect(sentry.init).toHaveBeenCalledWith(
			expect.objectContaining({
				dsn: "https://public@example.com/1",
				environment: "test",
				tracesSampleRate: 0.2,
			}),
		);

		expect(result).not.toBeNull();
		expect(result!.reactErrorHandlers).toBeDefined();
		expect(result!.reactErrorHandlers.onUncaughtError).toBeDefined();
		expect(result!.reactErrorHandlers.onCaughtError).toBeDefined();
		expect(result!.reactErrorHandlers.onRecoverableError).toBeDefined();
	});

	it("returns null when monitoring is disabled", async () => {
		const { __resetSentryInit, initSentry } = await import("../sentry");
		__resetSentryInit();

		runtimeConfig.monitoringEnabled = false;

		const result = initSentry(mockRouter);
		expect(result).toBeNull();
	});

	it("returns null when sentry DSN is empty", async () => {
		const { __resetSentryInit, initSentry } = await import("../sentry");
		__resetSentryInit();

		runtimeConfig.sentryDsn = "";

		const result = initSentry(mockRouter);
		expect(result).toBeNull();
	});

	it("initializes only once", async () => {
		const sentry = await import("@sentry/react");
		const { __resetSentryInit, initSentry } = await import("../sentry");
		__resetSentryInit();

		initSentry(mockRouter);
		initSentry(mockRouter);

		expect(sentry.init).toHaveBeenCalledTimes(1);
	});
});
