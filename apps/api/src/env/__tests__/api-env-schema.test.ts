import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateApiEnv, ApiEnvSchema } from "../api-env.schema";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.restoreAllMocks();
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function validEnv() {
  return {
    BETTER_AUTH_SECRET: "supersecretkeythatisatleastthirtytwochars",
    DATABASE_URL: "https://example.com/db",
    BETTER_AUTH_URL: "https://example.com/auth",
    CORS_ALLOWED_ORIGINS: "https://example.com",
    TRUSTED_PROXIES: "127.0.0.1",
    LEDGER_MVP_ENABLED: "true",
    NODE_ENV: "test",
  };
}

describe("ApiEnvSchema", () => {
  it("parses a valid environment", () => {
    Object.assign(process.env, validEnv());
    const result = ApiEnvSchema.safeParse(process.env);
    expect(result.success).toBe(true);
  });

  it("rejects missing BETTER_AUTH_SECRET", () => {
    Object.assign(process.env, { ...validEnv(), BETTER_AUTH_SECRET: undefined });
    const result = ApiEnvSchema.safeParse(process.env);
    expect(result.success).toBe(false);
  });

  it("rejects short BETTER_AUTH_SECRET", () => {
    Object.assign(process.env, { ...validEnv(), BETTER_AUTH_SECRET: "short" });
    const result = ApiEnvSchema.safeParse(process.env);
    expect(result.success).toBe(false);
  });

  it("rejects invalid DATABASE_URL", () => {
    Object.assign(process.env, { ...validEnv(), DATABASE_URL: "not-a-url" });
    const result = ApiEnvSchema.safeParse(process.env);
    expect(result.success).toBe(false);
  });

  it("rejects invalid BETTER_AUTH_URL", () => {
    Object.assign(process.env, { ...validEnv(), BETTER_AUTH_URL: "bad-url" });
    const result = ApiEnvSchema.safeParse(process.env);
    expect(result.success).toBe(false);
  });

  it("accepts missing optional fields", () => {
    delete process.env.NODE_ENV;
    delete process.env.CORS_ALLOWED_ORIGINS;
    delete process.env.TRUSTED_PROXIES;
    delete process.env.LEDGER_MVP_ENABLED;
    Object.assign(process.env, {
      BETTER_AUTH_SECRET: "supersecretkeythatisatleastthirtytwochars",
      DATABASE_URL: "https://example.com/db",
      BETTER_AUTH_URL: "https://example.com/auth",
    });
    const result = ApiEnvSchema.safeParse(process.env);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.CORS_ALLOWED_ORIGINS).toBeUndefined();
      expect(result.data.TRUSTED_PROXIES).toBeUndefined();
      expect(result.data.LEDGER_MVP_ENABLED).toBe("true");
      expect(result.data.NODE_ENV).toBe("development");
    }
  });
});

describe("validateApiEnv", () => {
  it("returns parsed env when all required vars are present", () => {
    Object.assign(process.env, validEnv());
    const env = validateApiEnv();
    expect(env.BETTER_AUTH_SECRET).toBe(validEnv().BETTER_AUTH_SECRET);
    expect(env.DATABASE_URL).toBe(validEnv().DATABASE_URL);
  });

  it("warns but returns partial in dev when required vars are missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    delete process.env.BETTER_AUTH_SECRET;
    delete process.env.DATABASE_URL;
    delete process.env.BETTER_AUTH_URL;
    process.env.NODE_ENV = "development";

    const env = validateApiEnv();

    expect(warnSpy).toHaveBeenCalled();
    expect(env.BETTER_AUTH_SECRET).toBe("");
    expect(env.LEDGER_MVP_ENABLED).toBe("true");
    expect(env.NODE_ENV).toBe("development");
    warnSpy.mockRestore();
  });

  it("logs error and exits in production when required vars are missing", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    delete process.env.BETTER_AUTH_SECRET;
    process.env.NODE_ENV = "production";

    validateApiEnv();

    expect(errorSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it("warns when CORS_ALLOWED_ORIGINS is not set", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    Object.assign(process.env, { ...validEnv(), CORS_ALLOWED_ORIGINS: undefined });

    validateApiEnv();

    const corsWarning = warnSpy.mock.calls.find(
      ([msg]) => typeof msg === "string" && msg.includes("CORS_ALLOWED_ORIGINS"),
    );
    expect(corsWarning).toBeDefined();
    warnSpy.mockRestore();
  });

  it("valid env passes without warnings for missing optionals", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    Object.assign(process.env, validEnv());

    validateApiEnv();

    const envWarnings = warnSpy.mock.calls.filter(
      ([msg]) => typeof msg === "string" && msg.startsWith("[ENV]"),
    );
    expect(envWarnings).toHaveLength(0);
    warnSpy.mockRestore();
  });
});
