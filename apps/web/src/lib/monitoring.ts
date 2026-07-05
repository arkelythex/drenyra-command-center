import * as Sentry from "@sentry/react";
import { runtimeConfig } from './runtime-config';

type TelemetryKind = 'error' | 'web-vital' | 'event' | 'pageview';
type WebVitalRating = 'good' | 'needs-improvement' | 'poor';

interface ErrorContext {
  source?: string;
  [key: string]: unknown;
}

interface TelemetryPayload {
  kind: TelemetryKind;
  name?: string;
  path?: string;
  value?: number;
  rating?: WebVitalRating;
  message?: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

interface PlausibleGlobal {
  (
    eventName: string,
    options?: { props?: Record<string, string | number | boolean | null> },
  ): void;
}

declare global {
  interface Window {
    plausible?: PlausibleGlobal;
  }
}

let monitoringInitialized = false;
let plausibleInitialized = false;
const plausibleQueue: Array<{
  eventName: string;
  props?: Record<string, string | number | boolean | null>;
}> = [];

const PLAUSIBLE_SCRIPT_ID = 'drenyra-plausible-sdk';

function toTelemetryProps(
  props?: Record<string, unknown>,
): Record<string, string | number | boolean | null> | undefined {
  if (!props) return undefined;

  const normalized: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(props)) {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      normalized[key] = value;
    } else if (value instanceof Date) {
      normalized[key] = value.toISOString();
    } else if (typeof value !== 'undefined') {
      normalized[key] = String(value);
    }
  }

  return normalized;
}

function sendTelemetry(payload: TelemetryPayload): void {
  const endpoint = resolveTelemetryEndpoint();
  if (!endpoint || typeof window === 'undefined') return;

  const body = JSON.stringify(payload);
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
      return;
    }
  } catch {
    // noop
  }

  void fetch(endpoint, {
    method: 'POST',
    headers: resolveTelemetryHeaders(),
    body,
    keepalive: true,
  }).catch(() => undefined);
}

function resolveTelemetryHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (runtimeConfig.monitoringKey) {
    headers['x-monitoring-key'] = runtimeConfig.monitoringKey;
  }
  return headers;
}

function resolveTelemetryEndpoint(): string {
  const endpoint = runtimeConfig.monitoringEndpoint;
  if (!endpoint || typeof window === 'undefined') {
    return endpoint;
  }
  return endpoint;
}

export function captureWebVital(
  name: 'LCP' | 'CLS' | 'INP' | 'TTFB',
  value: number,
  rating: WebVitalRating,
): void {
  sendTelemetry({
    kind: 'web-vital',
    name,
    value,
    rating,
    timestamp: new Date().toISOString(),
  });
}

function flushPlausibleQueue(): void {
  if (!window.plausible || plausibleQueue.length === 0) return;
  while (plausibleQueue.length > 0) {
    const item = plausibleQueue.shift();
    if (!item) continue;
    window.plausible(item.eventName, { props: item.props });
  }
}

function trackPlausible(
  eventName: string,
  props?: Record<string, string | number | boolean | null>,
): void {
  if (!runtimeConfig.plausibleDomain || typeof window === 'undefined') return;
  if (window.plausible) {
    window.plausible(eventName, { props });
    return;
  }
  plausibleQueue.push({ eventName, props });
}

// Sentry is now initialized via lib/sentry.ts with @sentry/react npm package.
// This module handles Plausible + telemetry + global error listeners.

function initPlausible(): void {
  if (!runtimeConfig.monitoringEnabled || !runtimeConfig.plausibleDomain) return;
  if (typeof document === 'undefined' || plausibleInitialized) return;

  const existingScript = document.getElementById(PLAUSIBLE_SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript) {
    plausibleInitialized = true;
    flushPlausibleQueue();
    return;
  }

  const script = document.createElement('script');
  script.id = PLAUSIBLE_SCRIPT_ID;
  script.defer = true;
  script.setAttribute('data-domain', runtimeConfig.plausibleDomain);
  script.src = `${runtimeConfig.plausibleApiHost}/js/script.js`;
  script.addEventListener('load', () => {
    plausibleInitialized = true;
    flushPlausibleQueue();
  });
  document.head.appendChild(script);
}

// Web Vitals are now tracked via lib/web-vitals.ts using the web-vitals npm package.

function initGlobalErrorListeners(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    const message = event.message || 'Unhandled script error';
    const fallback = new Error(message);
    const error = event.error instanceof Error ? event.error : fallback;
    captureError(error, {
      source: 'window.error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const error =
      reason instanceof Error
        ? reason
        : new Error(typeof reason === 'string' ? reason : 'Unhandled promise rejection');
    captureError(error, {
      source: 'window.unhandledrejection',
    });
  });
}

export function initMonitoring(): void {
  if (monitoringInitialized) return;
  monitoringInitialized = true;

  if (!runtimeConfig.monitoringEnabled) return;

  // Note: Sentry is initialized separately in lib/sentry.ts (before createRoot).
  // Web Vitals are initialized separately in lib/web-vitals.ts.
  initPlausible();
  initGlobalErrorListeners();
}

export function captureError(error: Error, context: ErrorContext = {}): void {
  if (!runtimeConfig.monitoringEnabled || typeof window === 'undefined') return;

  Sentry.captureException(error, {
    extra: context as Record<string, unknown>,
  });

  sendTelemetry({
    kind: 'error',
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
}

export function trackEvent(name: string, props?: Record<string, unknown>): void {
  if (!runtimeConfig.monitoringEnabled || typeof window === 'undefined') return;

  const normalizedProps = toTelemetryProps(props);
  trackPlausible(name, normalizedProps);
  sendTelemetry({
    kind: 'event',
    name,
    context: props,
    timestamp: new Date().toISOString(),
  });
}

export function trackPageView(path: string): void {
  if (!runtimeConfig.monitoringEnabled || typeof window === 'undefined') return;

  trackPlausible('pageview', { path });
  sendTelemetry({
    kind: 'pageview',
    path,
    timestamp: new Date().toISOString(),
  });
}
