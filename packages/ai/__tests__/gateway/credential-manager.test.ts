/**
 * Credential Manager Security Tests
 *
 * Tests for fail-closed behavior when no secure encryption key is configured.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	credentialManager,
	MissingEncryptionKeyError,
} from "../../src/gateway/credential.manager";

describe("CredentialManager - Security Hardening", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		// Clear encryption env vars before each test
		delete process.env.LLM_GATEWAY_KEY_PASSPHRASE;
		delete process.env.DRENYRA_MASTER_KEY;
	});

	afterEach(() => {
		// Restore original environment
		process.env = { ...originalEnv };
	});

	describe("fail-closed behavior", () => {
		it("should throw MissingEncryptionKeyError when no passphrase is configured", () => {
			expect(() => credentialManager.encryptApiKey("test-key")).toThrow(
				MissingEncryptionKeyError,
			);
		});

		it("should throw MissingEncryptionKeyError on decrypt when no passphrase is configured", () => {
			expect(() =>
				credentialManager.decryptApiKey('{"iv":"test","data":"test"}'),
			).toThrow(MissingEncryptionKeyError);
		});

		it("should accept LLM_GATEWAY_KEY_PASSPHRASE for encryption", () => {
			process.env.LLM_GATEWAY_KEY_PASSPHRASE = "secure-test-passphrase";

			const encrypted = credentialManager.encryptApiKey("my-api-key");
			expect(encrypted).toBeDefined();
			expect(encrypted).not.toBe("my-api-key");

			// Should be able to decrypt with the same passphrase
			const decrypted = credentialManager.decryptApiKey(encrypted);
			expect(decrypted).toBe("my-api-key");
		});

		it("should accept DRENYRA_MASTER_KEY for encryption", () => {
			process.env.DRENYRA_MASTER_KEY = "master-key-from-env";

			const encrypted = credentialManager.encryptApiKey("another-key");
			expect(encrypted).toBeDefined();

			const decrypted = credentialManager.decryptApiKey(encrypted);
			expect(decrypted).toBe("another-key");
		});

		it("should prefer LLM_GATEWAY_KEY_PASSPHRASE over DRENYRA_MASTER_KEY", () => {
			process.env.LLM_GATEWAY_KEY_PASSPHRASE = "gateway-specific";
			process.env.DRENYRA_MASTER_KEY = "master-key";

			// Encrypt with gateway-specific
			const encrypted = credentialManager.encryptApiKey("test-key");

			// Decrypt should work with the same key
			const decrypted = credentialManager.decryptApiKey(encrypted);
			expect(decrypted).toBe("test-key");
		});
	});

	describe("error message safety", () => {
		it("should not expose sensitive path information in error message", () => {
			delete process.env.LLM_GATEWAY_KEY_PASSPHRASE;
			delete process.env.DRENYRA_MASTER_KEY;

			try {
				credentialManager.encryptApiKey("test");
			} catch (error) {
				expect(error).toBeInstanceOf(MissingEncryptionKeyError);
				const message = (error as MissingEncryptionKeyError).message;
				// Should not contain file paths or sensitive env values
				expect(message).not.toContain("/");
				expect(message).not.toContain("drenyra-llm-gateway-default-key");
				expect(message).not.toContain("change-in-production");
			}
		});
	});
});
