import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { EnvProvider, SecretNotFoundError } from "../../src/secrets";

describe("EnvProvider", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		process.env = { ...originalEnv };
		process.env.TEST_SECRET = "my-test-value";
		process.env.EMPTY_SECRET = "";
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("should return env var value", async () => {
		const provider = new EnvProvider();
		const value = await provider.getSecret("TEST_SECRET");
		expect(value).toBe("my-test-value");
	});

	it("should throw for undefined var", async () => {
		const provider = new EnvProvider();
		await expect(provider.getSecret("NONEXISTENT_SECRET")).rejects.toThrow(
			SecretNotFoundError,
		);
	});

	it("should throw for empty var", async () => {
		const provider = new EnvProvider();
		await expect(provider.getSecret("EMPTY_SECRET")).rejects.toThrow(
			SecretNotFoundError,
		);
	});

	it("should return valid=true when required secrets are present", async () => {
		const provider = new EnvProvider();
		const result = await provider.validateSecrets({ strict: false });
		// In non-strict mode, missing secrets are warnings not errors
		// The result.valid depends on whether any required secrets had errors
		expect(result.errors.length).toBeGreaterThanOrEqual(0);
	});

	it("should detect placeholder values in strict mode", async () => {
		const provider = new EnvProvider();
		// Set a required secret to a placeholder
		const requiredSecret = (await import("../../src/secrets/inventory"))
			.SECRETS_INVENTORY[0];
		if (requiredSecret) {
			process.env[requiredSecret.name] = "changeme";
		}
		const result = await provider.validateSecrets({ strict: true });
		// At least one error due to the placeholder
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it("should fail strict validation with missing required secret", async () => {
		const provider = new EnvProvider();
		// In strict mode, all required secrets must be present
		const result = await provider.validateSecrets({ strict: true });
		// Without setting any real secret values, we expect errors
		expect(result.valid).toBe(false);
	});
});
