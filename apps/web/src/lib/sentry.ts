/**
 * Sentry monitoring for ARKELYTHEX (React 19 native).
 *
 * Initializes @sentry/react with:
 * - React error hooks (onUncaughtError, onCaughtError, onRecoverableError)
 * - TanStack Router tracing (pageload/navigation transactions)
 * - Session Replay (errors only in prod, sampled sessions)
 *
 * Design decisions:
 * - Uses the npm @sentry/react package instead of CDN dynamic loading
 *   to guarantee reactErrorHandler is available at createRoot time.
 * - The router is passed at init time so Sentry can instrument navigation.
 * - All config comes from runtime-config.ts for env-based toggling.
 */

import * as Sentry from "@sentry/react";
import type { Router } from "@tanstack/react-router";
import { runtimeConfig } from "./runtime-config";

export type SentryInitResult = {
	/** The Sentry hub, for manual instrumentation if needed. */
	hub: typeof Sentry;
	/** React 19 createRoot error handlers. */
	reactErrorHandlers: {
		onUncaughtError: (
			error: unknown,
			errorInfo: { componentStack?: string },
		) => void;
		onCaughtError: (
			error: unknown,
			errorInfo: { componentStack?: string },
		) => void;
		onRecoverableError: (
			error: unknown,
			errorInfo: { componentStack?: string },
		) => void;
	};
};

let _initialized = false;

/**
 * @internal — only for testing. Resets the singleton guard.
 */
export function __resetSentryInit(): void {
	_initialized = false;
}

/**
 * Initialize Sentry with the TanStack Router instance.
 *
 * Must be called BEFORE createRoot so reactErrorHandler is available
 * during the first render.
 *
 * Returns `null` when monitoring is disabled in config.
 */
export function initSentry(
	router: Router<unknown, unknown, unknown>,
): SentryInitResult | null {
	if (
		_initialized ||
		!runtimeConfig.monitoringEnabled ||
		!runtimeConfig.sentryDsn
	) {
		return null;
	}

	Sentry.init({
		dsn: runtimeConfig.sentryDsn,
		environment: runtimeConfig.sentryEnvironment,

		integrations: [
			Sentry.tanstackRouterBrowserTracingIntegration(router),
			...(runtimeConfig.sentryReplaysOnErrorSampleRate > 0
				? [
						Sentry.replayIntegration({
							maskAllText: true,
							blockAllMedia: true,
						}),
					]
				: []),
		],

		tracesSampleRate: runtimeConfig.sentryTracesSampleRate,
		replaysSessionSampleRate: runtimeConfig.sentryReplaysSessionSampleRate,
		replaysOnErrorSampleRate: runtimeConfig.sentryReplaysOnErrorSampleRate,
	});

	_initialized = true;

	const errorHandler = Sentry.reactErrorHandler();

	return {
		hub: Sentry,
		reactErrorHandlers: {
			onUncaughtError: errorHandler,
			onCaughtError: errorHandler,
			onRecoverableError: errorHandler,
		},
	};
}
