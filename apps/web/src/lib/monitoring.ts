/**
 * Browser monitoring: error reporting (Sentry), product analytics (Plausible)
 * and Core Web Vitals forwarding. Everything is a no-op unless
 * `runtimeConfig.monitoringEnabled` is set, and never throws into callers.
 */
import * as Sentry from "@sentry/react";
import { runtimeConfig } from "./runtime-config";

type EventProps = Record<string, string | number | boolean>;
type WebVitalName = "LCP" | "CLS" | "INP" | "TTFB";
type WebVitalRating = "good" | "needs-improvement" | "poor";

declare global {
	interface Window {
		plausible?: (
			event: string,
			options?: { props?: EventProps; u?: string },
		) => void;
	}
}

export function captureError(error: Error, context?: Record<string, unknown>) {
	if (import.meta.env.DEV) console.error("[monitoring]", error, context);
	if (!runtimeConfig.monitoringEnabled) return;
	try {
		Sentry.captureException(error, context ? { extra: context } : undefined);
	} catch {
		// Reporting must never break the caller.
	}
}

export function trackEvent(name: string, props?: EventProps) {
	if (!runtimeConfig.monitoringEnabled || typeof window === "undefined") return;
	window.plausible?.(name, props ? { props } : undefined);
}

export function trackPageView(path: string) {
	trackEvent("pageview", { path });
}

/** Sends a Core Web Vital to the telemetry endpoint when one is configured. */
export function captureWebVital(
	name: WebVitalName,
	value: number,
	rating: WebVitalRating,
) {
	const { monitoringEnabled, monitoringEndpoint } = runtimeConfig;
	if (!monitoringEnabled || !monitoringEndpoint) return;
	if (typeof navigator === "undefined" || !navigator.sendBeacon) return;
	try {
		navigator.sendBeacon(
			monitoringEndpoint,
			JSON.stringify({ type: "web-vital", name, value, rating }),
		);
	} catch {
		// Telemetry is best-effort.
	}
}

let initialized = false;

export function initMonitoring() {
	if (initialized || !runtimeConfig.monitoringEnabled) return;
	if (!runtimeConfig.sentryDsn) return;
	initialized = true;
	Sentry.init({
		dsn: runtimeConfig.sentryDsn,
		environment: runtimeConfig.sentryEnvironment,
		tracesSampleRate: runtimeConfig.sentryTracesSampleRate,
		replaysSessionSampleRate: runtimeConfig.sentryReplaysSessionSampleRate,
		replaysOnErrorSampleRate: runtimeConfig.sentryReplaysOnErrorSampleRate,
		integrations: [Sentry.replayIntegration()],
	});
}
