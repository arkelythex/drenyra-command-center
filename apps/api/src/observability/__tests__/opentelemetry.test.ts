import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const useMock = vi.fn();

vi.mock("@elysiajs/opentelemetry", () => ({
	opentelemetry: vi.fn((options?: Record<string, unknown>) => ({
		plugin: "otel",
		options,
	})),
}));

describe("attachOptionalOpenTelemetry", () => {
	const ORIGINAL_ENV = { ...process.env };

	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		process.env = { ...ORIGINAL_ENV };
		useMock.mockReset();
	});

	afterEach(() => {
		process.env = { ...ORIGINAL_ENV };
	});

	it("returns app unchanged when otel is disabled", async () => {
		delete process.env.DRENYRA_ENABLE_OTEL;
		const app = { use: useMock };

		const { attachOptionalOpenTelemetry } = await import("../opentelemetry");
		const result = await attachOptionalOpenTelemetry(app);

		expect(result).toBe(app);
		expect(useMock).not.toHaveBeenCalled();
	});

	it("attaches plugin when otel is enabled", async () => {
		process.env.DRENYRA_ENABLE_OTEL = "true";
		process.env.OTEL_SERVICE_NAME = "drenyra-api-test";
		const app = {
			use: useMock.mockReturnValue("next-app"),
		};

		const { attachOptionalOpenTelemetry } = await import("../opentelemetry");
		const result = await attachOptionalOpenTelemetry(app);

		expect(useMock).toHaveBeenCalledOnce();
		expect(result).toBe("next-app");
	});
});
