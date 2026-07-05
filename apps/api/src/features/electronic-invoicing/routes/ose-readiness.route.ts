import { Elysia } from "elysia";
import { getTaxAuthority } from "../../../lib/tax-authority-provider";
import { oseConfigValidator } from "../../../services/ose";
import { OSEService } from "../../../services/ose.service";
import { ok } from "../../shared/api-response";

/**
 * electronicInvoicingOseReadinessRoute const.
 *
 * Uses TaxAuthorityPort.checkConnectivity() for provider status,
 * while keeping OSE-specific config validation for backward compat.
 *
 * @example
 * ```ts
 * console.log(electronicInvoicingOseReadinessRoute);
 * ```
 */
export const electronicInvoicingOseReadinessRoute = new Elysia().get(
	"/ose/readiness",
	async () => {
		const config = OSEService.getConfig();
		const configValidation = oseConfigValidator.validate(config);

		// Use TaxAuthorityPort for provider connectivity
		let providerStatus: { online: boolean; message: string } = {
			online: false,
			message: "Could not check connectivity",
		};
		try {
			const adapter = await getTaxAuthority(0); // org-agnostic check
			providerStatus = await adapter.checkConnectivity();
		} catch {
			// Fall back to legacy OSEService check if adapter fails
			providerStatus = await OSEService.checkStatus();
		}
		const effectiveProvider =
			config.simulationMode === true ? "simulation" : config.provider;

		const readinessStatus =
			effectiveProvider === "simulation"
				? "simulation"
				: configValidation.valid && providerStatus.online
					? "ready"
					: configValidation.valid
						? "provider_offline"
						: "config_invalid";

		return ok({
			status: readinessStatus,
			provider: effectiveProvider,
			environment: config.environment ?? "sandbox",
			simulationMode: config.simulationMode === true,
			online: providerStatus.online,
			message: providerStatus.message,
			configuration: {
				valid: configValidation.valid,
				missing: configValidation.missing,
				errors: configValidation.errors,
				hasApiUrl: Boolean(config.apiUrl?.trim()),
				hasApiToken: Boolean(config.apiToken?.trim()),
				hasCompanyRuc: Boolean(config.ruc?.trim()),
				hasUsername: Boolean(config.username?.trim()),
				hasWebhookSecret: Boolean(config.webhookSecret?.trim()),
			},
		});
	},
	{
		detail: {
			summary: "Diagnóstico de readiness OSE",
			description:
				"Expone si el proveedor OSE está listo, degradado o en simulación sin revelar secretos. Útil para soporte, beta y health checks operativos.",
			tags: ["Electronic Invoicing", "OSE"],
		},
	},
);
