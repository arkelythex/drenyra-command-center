/**
 * Core Web Vitals tracking using the `web-vitals` library.
 *
 * Replaces the legacy custom PerformanceObserver implementation with the
 * maintained `web-vitals` package which handles edge cases correctly
 * (background tab, attribution, multiple observers, etc.).
 *
 * Metrics are reported to:
 * 1. Sentry (via `Sentry.metrics.emit` or breadcrumbs)
 * 2. Telemetry endpoint (via `captureWebVital` from monitoring.ts)
 * 3. Poor ratings trigger a Plausible event
 */

import { onCLS, onINP, onLCP, onTTFB } from "web-vitals";
import type { Metric } from "web-vitals";
import { runtimeConfig } from "./runtime-config";
import { captureWebVital, trackEvent } from "./monitoring";

let _initialized = false;

/**
 * @internal — only for testing. Resets the singleton guard.
 */
export function __resetWebVitalsInit(): void {
  _initialized = false;
}

/**
 * Start listening for Core Web Vitals and report them.
 *
 * Safe to call multiple times — only the first call initializes observers.
 */
export function initWebVitals(): void {
  if (_initialized || !runtimeConfig.monitoringEnabled || !runtimeConfig.webVitalsEnabled) {
    return;
  }
  if (typeof window === "undefined") return;

  _initialized = true;

  const report = (metric: Metric) => {
    const { name, value, rating } = metric;

    captureWebVital(name as "LCP" | "CLS" | "INP" | "TTFB", value, rating);

    if (rating === "poor") {
      trackEvent("web_vital_poor", { metric: name, value });
    }
  };

  onLCP(report);
  onCLS(report);
  onINP(report);
  onTTFB(report);
}
