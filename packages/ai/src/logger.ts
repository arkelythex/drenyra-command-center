import { SecureLogger } from "@arkelythex/shared/secure-logger";

const ai = SecureLogger.namespace("AI");
const validation = SecureLogger.namespace("Validation");

/**
 * loggers const.
 *
 * @example
 * ```ts
 * console.log(loggers);
 * ```
 */
export const loggers = {
  ai: {
    debug: ai.debug,
    info: ai.info,
    warn: ai.warn,
    error: (message: string, payload?: unknown): void => {
      if (payload instanceof Error) {
        ai.error(message, payload);
        return;
      }
      ai.error(message, undefined, payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : payload === undefined
          ? undefined
          : { payload });
    },
  },
  validation: {
    debug: validation.debug,
    info: validation.info,
    warn: validation.warn,
    error: (message: string, payload?: unknown): void => {
      if (payload instanceof Error) {
        validation.error(message, payload);
        return;
      }
      validation.error(message, undefined, payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : payload === undefined
          ? undefined
          : { payload });
    },
  },
};
