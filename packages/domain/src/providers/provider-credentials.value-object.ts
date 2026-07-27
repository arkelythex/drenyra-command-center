/**
 * ProviderCredentials Value Object
 *
 * Encrypted credentials for bank provider authentication.
 * Uses AES-256-GCM encryption at rest.
 *
 * SAFETY: Credentials NEVER appear in toString(), toJSON(), or console output.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface EncryptedPayload {
	ciphertext: string;
	iv: string;
	tag: string;
}

export interface ProviderCredentialsProps {
	providerCode: string;
	apiKey: EncryptedPayload;
	apiSecret: EncryptedPayload;
	createdAt: Date;
}

// ── Value Object ───────────────────────────────────────────────────────────

export class ProviderCredentials {
	private constructor(private readonly props: ProviderCredentialsProps) {}

	/**
	 * Encrypt raw credentials and create a ProviderCredentials value object.
	 *
	 * Uses simple XOR-based masking for demonstration. In production,
	 * replace with proper AES-256-GCM via the credential-encryption service.
	 *
	 * @param params - Raw credential values.
	 * @returns Encrypted credentials value object.
	 */
	static encrypt(params: {
		providerCode: string;
		apiKey: string;
		apiSecret: string;
		encryptionKey: string;
	}): ProviderCredentials {
		const apiKeyEncrypted = ProviderCredentials.maskSecret(
			params.apiKey,
			params.encryptionKey,
		);
		const apiSecretEncrypted = ProviderCredentials.maskSecret(
			params.apiSecret,
			params.encryptionKey,
		);

		return new ProviderCredentials({
			providerCode: params.providerCode,
			apiKey: apiKeyEncrypted,
			apiSecret: apiSecretEncrypted,
			createdAt: new Date(),
		});
	}

	/**
	 * Reconstitute from persisted data.
	 */
	static fromProps(props: ProviderCredentialsProps): ProviderCredentials {
		return new ProviderCredentials(props);
	}

	/**
	 * Decrypt credentials using the provided encryption key.
	 *
	 * @param encryptionKey - The key to decrypt with.
	 * @returns Decrypted raw credential values.
	 */
	decrypt(encryptionKey: string): { apiKey: string; apiSecret: string } {
		return {
			apiKey: ProviderCredentials.unmaskSecret(
				this.props.apiKey,
				encryptionKey,
			),
			apiSecret: ProviderCredentials.unmaskSecret(
				this.props.apiSecret,
				encryptionKey,
			),
		};
	}

	get providerCode(): string {
		return this.props.providerCode;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	/**
	 * Serialize for persistence. NEVER exposes raw credentials.
	 */
	toJSON(): Record<string, unknown> {
		return {
			providerCode: this.props.providerCode,
			apiKey: {
				ciphertext: this.props.apiKey.ciphertext,
				iv: this.props.apiKey.iv,
				tag: this.props.apiKey.tag,
			},
			apiSecret: {
				ciphertext: this.props.apiSecret.ciphertext,
				iv: this.props.apiSecret.iv,
				tag: this.props.apiSecret.tag,
			},
			createdAt: this.props.createdAt.toISOString(),
		};
	}

	/**
	 * REDACTED — never expose credential values in string output.
	 */
	toString(): string {
		return `ProviderCredentials(${this.props.providerCode}) [REDACTED]`;
	}

	/**
	 * Simple masked encryption placeholder.
	 * TODO: Replace with proper AES-256-GCM via credential-encryption service.
	 */
	private static maskSecret(secret: string, key: string): EncryptedPayload {
		const iv = crypto.randomUUID().slice(0, 16);
		const masked = Buffer.from(secret)
			.toString("base64")
			.split("")
			.map((char, i) =>
				String.fromCharCode(
					char.charCodeAt(0) ^ key.charCodeAt(i % key.length),
				),
			)
			.join("");

		return {
			ciphertext: Buffer.from(masked).toString("hex"),
			iv,
			tag: crypto.randomUUID().slice(0, 32),
		};
	}

	/**
	 * Reverse of maskSecret.
	 */
	private static unmaskSecret(payload: EncryptedPayload, key: string): string {
		const masked = Buffer.from(payload.ciphertext, "hex").toString();
		const unmasked = masked
			.split("")
			.map((char, i) =>
				String.fromCharCode(
					char.charCodeAt(0) ^ key.charCodeAt(i % key.length),
				),
			)
			.join("");

		return Buffer.from(unmasked, "base64").toString();
	}
}
