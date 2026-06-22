import { Elysia } from "elysia";
import { OSEService } from "../../../services/ose.service";
import { oseConfigValidator } from "../../../services/ose";
import { ok } from "../../shared/api-response";

/**
 * electronicInvoicingOseReadinessRoute const.
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
		const providerStatus = await OSEService.checkStatus();
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
