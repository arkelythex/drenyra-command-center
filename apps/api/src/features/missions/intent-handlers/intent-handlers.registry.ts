/**
 * INTENT_HANDLERS — Registry of intent-specific mission handlers.
 *
 * Each intent that requires custom pipeline execution registers its handler here.
 * Intents without a registered handler use the default no-op behavior.
 */
import type { MissionIntentHandler } from "./mission-intent-handler.interface";

export const INTENT_HANDLERS = new Map<string, MissionIntentHandler>();

/**
 * Registers a handler for a given mission intent.
 */
export function registerIntentHandler(intent: string, handler: MissionIntentHandler): void {
  INTENT_HANDLERS.set(intent, handler);
}

/**
 * Retrieves the handler for a given intent, or undefined if none registered.
 */
export function getIntentHandler(intent: string): MissionIntentHandler | undefined {
  return INTENT_HANDLERS.get(intent);
}
