/**
 * LLM Gateway - Credential Manager
 *
 * Manages encrypted API credentials for multiple LLM providers.
 * Handles encryption/decryption of API keys and credential retrieval.
 *
 * NOTE: Full DB integration pending Phase 3. Currently uses environment variables.
 *
 * @module @drenyra/ai/gateway
 */

import {
	decryptWithPassphrase,
	type EncryptedData,
	encryptWithPassphrase,
} from "@drenyra/shared/security";
import { loggers } from "../logger";
import type { DecryptedCredential, LLMProvider } from "./types";

/**
 * Error thrown when no secure encryption configuration is available.
 * Message is safe - does not expose sensitive path information.
 */
export class MissingEncryptionKeyError extends Error {
	constructor() {
		super(
			"Encryption passphrase not configured. Set LLM_GATEWAY_KEY_PASSPHRASE or ARKELYTHEX_MASTER_KEY environment variable.",
		);
		this.name = "MissingEncryptionKeyError";
	}
}

/**
 * Validates that a secure encryption key is configured.
 * Fails in production contexts when no valid key is available.
 *
 * @throws MissingEncryptionKeyError if no secure key is configured
 */
function validateEncryptionKey(): string {
	const passphrase =
		process.env.LLM_GATEWAY_KEY_PASSPHRASE ?? process.env.ARKELYTHEX_MASTER_KEY;

	// In production, we require explicit configuration - no fallback
	if (!passphrase) {
		throw new MissingEncryptionKeyError();
	}

	return passphrase;
}

/**
 * Credential Manager for LLM providers.
 * Handles secure storage and retrieval of API credentials.
 *
 * Currently supports:
 * - Environment variable based credentials
 * - Encryption/decryption for stored keys
 *
 * Full database integration coming in Phase 3.
 */
export class CredentialManager {
	/**
	 * Environment variable mapping for providers.
	 */
	private static readonly ENV_KEYS: Record<LLMProvider, string> = {
		anthropic: "ANTHROPIC_API_KEY",
		openai: "OPENAI_API_KEY",
		google: "GOOGLE_API_KEY",
		grok: "GROK_API_KEY",
		openrouter: "OPENROUTER_API_KEY",
		ollama: "OLLAMA_API_KEY",
		deepseek: "DEEPSEEK_API_KEY",
	};

	/**
	 * Encrypts an API key for storage.
	 *
	 * @param apiKey - Raw API key to encrypt
	 * @returns Encrypted string suitable for database storage
	 * @throws MissingEncryptionKeyError if no secure key is configured
	 */
	encryptApiKey(apiKey: string): string {
		const passphrase = validateEncryptionKey();
		const encrypted = encryptWithPassphrase(apiKey, passphrase);
		return JSON.stringify(encrypted);
	}

	/**
	 * Decrypts an API key from storage.
	 *
	 * @param encryptedApiKey - Encrypted string from database
	 * @returns Decrypted raw API key
	 * @throws MissingEncryptionKeyError if no secure key is configured
	 */
	decryptApiKey(encryptedApiKey: string): string {
		const passphrase = validateEncryptionKey();
		const encrypted: EncryptedData = JSON.parse(encryptedApiKey);
		return decryptWithPassphrase(encrypted, passphrase);
	}

	/**
	 * Gets active credential for a provider from environment.
	 * Note: Full DB integration in Phase 3.
	 *
	 * @param _organizationId - Organization ID (reserved for Phase 3)
	 * @param provider - LLM provider type
	 * @returns Decrypted credential or null if not configured
	 */
	async getActiveCredential(
		_organizationId: number,
		provider: LLMProvider,
	): Promise<DecryptedCredential | null> {
		const envKey = CredentialManager.ENV_KEYS[provider];
		const apiKey = process.env[envKey];

		if (!apiKey) {
			loggers.ai.warn("No API key configured for provider", {
				provider,
				envKey,
			});
			return null;
		}

		return {
			provider,
			apiKey,
			baseUrl: this.getProviderBaseUrl(provider),
		};
	}

	/**
	 * Gets the default credential for an organization.
	 * Uses OPENROUTER as default provider.
	 *
	 * @param _organizationId - Organization ID
	 * @returns Decrypted default credential or null
	 */
	async getDefaultCredential(
		_organizationId: number,
	): Promise<DecryptedCredential | null> {
		return this.getActiveCredential(_organizationId, "openrouter");
	}

	/**
	 * Gets all active credentials for an organization from environment.
	 *
	 * @param _organizationId - Organization ID (reserved for Phase 3)
	 * @returns Array of decrypted credentials
	 */
	async getAllCredentials(
		_organizationId: number,
	): Promise<DecryptedCredential[]> {
		const credentials: DecryptedCredential[] = [];

		for (const provider of Object.keys(
			CredentialManager.ENV_KEYS,
		) as LLMProvider[]) {
			const credential = await this.getActiveCredential(
				_organizationId,
				provider,
			);
			if (credential) {
				credentials.push(credential);
			}
		}

		return credentials;
	}

	/**
	 * Checks if credentials are configured for a provider.
	 */
	hasCredential(provider: LLMProvider): boolean {
		const envKey = CredentialManager.ENV_KEYS[provider];
		return !!process.env[envKey];
	}

	/**
	 * Returns base URL for a provider.
	 */
	private getProviderBaseUrl(provider: LLMProvider): string | undefined {
		const baseUrls: Record<LLMProvider, string | undefined> = {
			anthropic: "https://api.anthropic.com",
			openai: "https://api.openai.com/v1",
			google: "https://generativelanguage.googleapis.com/v1beta",
			grok: "https://api.x.ai/v1",
			openrouter: "https://openrouter.ai/api/v1",
			ollama: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
			deepseek: "https://api.deepseek.com/v1",
		};

		return baseUrls[provider];
	}
}

/**
 * Default credential manager instance.
 */
export const credentialManager = new CredentialManager();
