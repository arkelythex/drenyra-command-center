import type { EventBusPort } from "@drenyra/infrastructure/events/event.port";
import { SecureLogger } from "@drenyra/shared/secure-logger";
import { cashflowRetentionHandler } from "./cashflow-retention.handler";

const logger = SecureLogger.namespace("TaxationEventBootstrap");

type TaxationEventBootstrapStatus =
	| { status: "not_configured" }
	| { status: "ready" }
	| { status: "disabled"; error: string };

let bootstrapStatus: TaxationEventBootstrapStatus = {
	status: "not_configured",
};

/**
 * Bootstraps taxation event subscriptions and records readiness status.
 *
 * @param eventBus - Optional externally managed event bus instance
 * @returns Promise that resolves after bootstrap attempts
 * @example
 * ```ts
 * await bootstrapTaxationEventSubscriptions();
 * ```
 */
export async function bootstrapTaxationEventSubscriptions(
	eventBus?: EventBusPort,
): Promise<void> {
	if (!process.env.NATS_URL && !eventBus) {
		bootstrapStatus = { status: "not_configured" };
		logger.info(
			"Skipping taxation event subscriptions bootstrap: NATS_URL not configured",
		);
		return;
	}

	try {
		const bus = eventBus ?? (await connectAndGetEventBus());
		await cashflowRetentionHandler.registerSubscriptions(bus);
		bootstrapStatus = { status: "ready" };
		logger.info("Taxation event subscriptions ready");
	} catch (error) {
		bootstrapStatus = {
			status: "disabled",
			error: error instanceof Error ? error.message : String(error),
		};
		logger.warn("Taxation event subscriptions disabled", {
			error: bootstrapStatus.error,
		});
	}
}

/**
 * Returns the last-known taxation event bootstrap state.
 *
 * @returns Taxation event bootstrap readiness snapshot
 * @example
 * ```ts
 * const status = getTaxationEventBootstrapStatus();
 * ```
 */
export function getTaxationEventBootstrapStatus(): TaxationEventBootstrapStatus {
	return bootstrapStatus;
}

async function connectAndGetEventBus(): Promise<EventBusPort> {
	const loadNatsAdapter = new Function(
		"specifier",
		"return import(specifier)",
	) as (specifier: string) => Promise<{
		connectEventBus: () => Promise<void>;
		getEventBus: () => EventBusPort;
	}>;

	const { connectEventBus, getEventBus } = await loadNatsAdapter(
		"@drenyra/infrastructure/events/nats.adapter",
	);
	await connectEventBus();
	return getEventBus();
}
