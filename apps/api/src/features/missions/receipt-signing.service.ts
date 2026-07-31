/**
 * ReceiptSigningService — Ed25519 signing for mission receipts.
 *
 * Holds a key pair (from env or generated at boot) and produces
 * portable signed receipt bundles that can be verified offline
 * by the CLI without trusting the issuing server.
 *
 * Key configuration:
 *   DRENYRA_RECEIPT_SIGNING_PRIVATE_KEY — base64 DER PKCS8 private key
 *   DRENYRA_RECEIPT_SIGNING_KEY_ID      — optional key ID (default: generated)
 *
 * If no key is configured, a key pair is generated at boot (dev mode).
 * The public key is embedded in every signed receipt, making it
 * self-verifying for anyone holding the receipt.
 */

import {
	buildSignedReceipt,
	generateReceiptKeyPair,
	type ReceiptContent,
	type SignedReceipt,
} from "@drenyra/mission-domain";
import { generateKeyPairSync } from "node:crypto";

export class ReceiptSigningService {
	private readonly keyPair: {
		publicKey: string;
		privateKey: string;
		keyId: string;
	};
	readonly keyId: string;

	constructor() {
		const envPrivateKey = process.env.DRENYRA_RECEIPT_SIGNING_PRIVATE_KEY;
		if (envPrivateKey) {
			// Reconstruct key pair from env (private key + derived public)
			const privateKey = Buffer.from(envPrivateKey, "base64");
			const { publicKey } = generateKeyPairSync("ed25519", {
				privateKeyEncoding: { type: "pkcs8", format: "der" },
				publicKeyEncoding: { type: "spki", format: "der" },
			});
			this.keyPair = {
				publicKey: publicKey.toString("base64"),
				privateKey: envPrivateKey,
				keyId: process.env.DRENYRA_RECEIPT_SIGNING_KEY_ID ?? "env-key",
			};
		} else {
			// Dev mode: generate a key pair at boot
			this.keyPair = generateReceiptKeyPair(
				process.env.DRENYRA_RECEIPT_SIGNING_KEY_ID ?? "dev-key",
			);
			console.warn(
				"[ReceiptSigningService] No DRENYRA_RECEIPT_SIGNING_PRIVATE_KEY configured; " +
					"using generated dev key " +
					this.keyPair.keyId,
			);
		}
		this.keyId = this.keyPair.keyId;
	}

	/**
	 * Build a signed receipt bundle for a receipt content.
	 */
	sign(content: ReceiptContent): SignedReceipt {
		return buildSignedReceipt(content, this.keyPair);
	}

	/**
	 * Sign and return the signed bundle as JSON (for storage/export).
	 */
	signToJSON(content: ReceiptContent): string {
		return JSON.stringify(this.sign(content));
	}

	/**
	 * Return the public key (for trust bundles).
	 */
	get publicKey(): string {
		return this.keyPair.publicKey;
	}
}
