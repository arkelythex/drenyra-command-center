import { loadApiEnv } from "./env/load-api-env";

// Keep the Eden Treaty type import stable for the frontend.
export type { App } from "./app-core";

// Ensure `.env` is loaded even when workspace scripts run from repo root.
await loadApiEnv();

// Runtime listen/OTEL lives in `app-listen` (excluded from quality typecheck graph).
await import("./app-listen");
