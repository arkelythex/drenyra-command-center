/**
 * OSE Service - Main Entry Point
 * Facade pattern - delegates to specialized modules
 *
 * @principle Single Responsibility - Orchestrates, doesn't implement
 * @principle Dependency Inversion - Depends on abstractions (IOSEProvider)
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { oseConfigValidator } from "./config-validator";
import { OSEProviderFactory } from "./providers/factory";
import type {
	AttemptTrace,
	OSEConfig,
	OSEResponse,
	SendInvoiceData,
} from "./types";

export class OSEService {
	private static config: OSEConfig = {
		provider: OSEService.parseProvider(process.env.OSE_PROVIDER),
		apiUrl: process.env.OSE_API_URL || "https://api.nubefact.com/api/v1",
		apiToken: process.env.OSE_API_TOKEN || "",
		ruc: process.env.COMPANY_RUC || "",
		username: process.env.OSE_USERNAME || "",
		environment:
			process.env.OSE_ENV?.toLowerCase() === "production"
				? "production"
				: "sandbox",
		simulationMode: OSEService.parseBoolean(process.env.OSE_SIMULATION_MODE),
		webhookSecret: process.env.OSE_WEBHOOK_SECRET || "",
	};

	private static readonly MAX_RETRIES = 3;
	private static readonly RETRY_DELAY = 2000;

	static async sendInvoice(data: SendInvoiceData): Promise<OSEResponse> {
		const effectiveConfig = OSEService.getEffectiveConfig();

		// 1. Validate config
		const validation = oseConfigValidator.validate(effectiveConfig);
		if (!validation.valid) {
			return OSEService.createConfigErrorResponse(validation);
		}

		// 2. Get provider via factory
		const provider = OSEProviderFactory.create(effectiveConfig);

		// 3. Execute with retry
		return OSEService.executeWithRetry(() => provider.send(data));
	}

	static async checkStatus(): Promise<{
		online: boolean;
		provider: string;
		message: string;
	}> {
		try {
			const effectiveConfig = OSEService.getEffectiveConfig();
			const provider = OSEProviderFactory.create(effectiveConfig);
			const status = await provider.checkStatus();
			return {
				online: status.online,
				provider: effectiveConfig.provider,
				message: status.message,
			};
		} catch (error) {
			return {
				online: false,
				provider: OSEService.getEffectiveConfig().provider,
				message: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
			};
		}
	}

	/**
	 * Verify signed webhook payload (HMAC SHA-256).
	 * Returns true when no webhook secret is configured to allow local development.
	 */
	static verifyWebhookSignature(
		rawPayload: string,
		signatureHeader?: string,
	): boolean {
		const secret = (OSEService.config.webhookSecret ?? "").trim();
		if (!secret) return true;
		if (!signatureHeader) return false;

		const provided = signatureHeader.startsWith("sha256=")
			? signatureHeader.slice("sha256=".length)
			: signatureHeader;
		const expected = createHmac("sha256", secret)
			.update(rawPayload)
			.digest("hex");

		try {
			const providedBuffer = Buffer.from(provided, "hex");
			const expectedBuffer = Buffer.from(expected, "hex");
			if (providedBuffer.length !== expectedBuffer.length) return false;
			return timingSafeEqual(providedBuffer, expectedBuffer);
		} catch {
			return false;
		}
	}

	static parseCDR(cdrBase64: string): {
		status: string;
		message: string;
		code: string;
	} {
		try {
			const cdrContent = Buffer.from(cdrBase64, "base64").toString("utf8");
			const statusMatch = cdrContent.match(
				/<cbc:ResponseCode>(\d+)<\/cbc:ResponseCode>/,
			);
			const messageMatch = cdrContent.match(
				/<cbc:Description>(.+?)<\/cbc:Description>/,
			);

			return {
				status: statusMatch?.[1] ?? "UNKNOWN",
				message: messageMatch?.[1] ?? "No message",
				code: statusMatch?.[1] ?? "0",
			};
		} catch {
			return { status: "ERROR", message: "Failed to parse CDR", code: "0" };
		}
	}

	static updateConfig(newConfig: Partial<OSEConfig>): void {
		OSEService.config = { ...OSEService.config, ...newConfig };
	}

	static getConfig(): OSEConfig {
		return { ...OSEService.config };
	}

	// Private helpers
	private static getEffectiveConfig(): OSEConfig {
		if (OSEService.config.simulationMode === true) {
			return {
				...OSEService.config,
				provider: "simulation",
			};
		}
		return OSEService.config;
	}

	private static parseBoolean(value: string | undefined): boolean {
		if (!value) return false;
		const normalized = value.trim().toLowerCase();
		return normalized === "1" || normalized === "true" || normalized === "yes";
	}

	private static parseProvider(
		value: string | undefined,
	): OSEConfig["provider"] {
		switch ((value ?? "nubefact").trim().toLowerCase()) {
			case "nubefact":
				return "nubefact";
			case "bizlinks":
				return "bizlinks";
			case "custom":
				return "custom";
			case "simulation":
				return "simulation";
			default:
				return "nubefact";
		}
	}

	private static createConfigErrorResponse(validation: {
		missing: string[];
	}): OSEResponse {
		return {
			success: false,
			error: `OSE not configured. Missing: ${validation.missing.join(", ")}`,
			attemptsCount: 0,
			attemptTrace: [
				{
					attempt: 0,
					status: "ERROR",
					message: `Configuration missing: ${validation.missing.join(", ")}`,
					at: new Date().toISOString(),
				},
			],
		};
	}

	private static async executeWithRetry(
		operation: () => Promise<OSEResponse>,
	): Promise<OSEResponse> {
		const attemptTrace: AttemptTrace[] = [];
		let lastError: Error | null = null;

		for (let attempt = 1; attempt <= OSEService.MAX_RETRIES; attempt++) {
			try {
				const result = await operation();

				attemptTrace.push({
					attempt,
					status: result.success ? "SUCCESS" : "ERROR",
					message:
						result.sunatDescription || result.error || "Operation completed",
					at: new Date().toISOString(),
				});

				return { ...result, attemptsCount: attempt, attemptTrace };
			} catch (error) {
				lastError = error as Error;
				attemptTrace.push({
					attempt,
					status: "ERROR",
					message: lastError.message,
					at: new Date().toISOString(),
				});

				if (attempt < OSEService.MAX_RETRIES) {
					await OSEService.delay(OSEService.RETRY_DELAY * attempt);
				}
			}
		}

		return {
			success: false,
			error: `Failed after ${OSEService.MAX_RETRIES} attempts: ${lastError?.message}`,
			attemptsCount: OSEService.MAX_RETRIES,
			attemptTrace,
		};
	}

	private static delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
