/**
 * AI package logger barrel.
 *
 * Re-exports the `loggers` namespace from `services/logger` so modules can
 * keep importing from `../logger` regardless of their depth. The original
 * `src/logger.ts` was moved into `services/` by the 28165e120 refactor; this
 * barrel preserves the public import path for the 29 importers across the
 * package (gateway, context-monitor, agents, session, ...).
 *
 * @module @drenyra/ai/logger
 */

export { loggers } from "./services/logger";
