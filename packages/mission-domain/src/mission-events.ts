/**
 * Mission events — SSE event types, parsing, and formatting.
 *
 * Implements the SSE wire protocol: data lines with single-line JSON,
 * keepalive comments, and sequence-based resume.
 */

import type { MissionSnapshot } from "./mission-contracts.js";

/**
 * All mission event types used in SSE streaming.
 */
export enum MissionEventType {
  STATE_TRANSITION = "STATE_TRANSITION",
  PROGRESS_UPDATE = "PROGRESS_UPDATE",
  BLOCKER_ADDED = "BLOCKER_ADDED",
  BLOCKER_RESOLVED = "BLOCKER_RESOLVED",
  PROPOSAL_CREATED = "PROPOSAL_CREATED",
  APPROVAL_DECIDED = "APPROVAL_DECIDED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  TIMEOUT = "TIMEOUT",
  UNKNOWN = "UNKNOWN",
  RECONCILED = "RECONCILED",
  KEEPALIVE = "KEEPALIVE",
}

/**
 * A mission event as transmitted over SSE.
 */
export interface MissionEvent {
  id: string;
  missionId: string;
  sequence: number;
  eventType: MissionEventType;
  snapshot: MissionSnapshot;
  createdAt: string;
}

/**
 * Parses a single SSE line into a MissionEvent.
 *
 * Returns null for keepalive comments, empty lines, or malformed JSON.
 * Handles lines both with and without the "data: " prefix.
 *
 * Wire format: `data: {single-line JSON}\n\n`
 * Heartbeat: `:keepalive\n\n`
 */
export function parseSSEEvent(line: string): MissionEvent | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith(":")) {
    return null;
  }

  let jsonStr = trimmed;
  if (jsonStr.startsWith("data:")) {
    jsonStr = jsonStr.slice(5).trim();
  }

  if (!jsonStr) {
    return null;
  }

  try {
    return JSON.parse(jsonStr) as MissionEvent;
  } catch {
    return null;
  }
}

/**
 * Returns true if the line is an SSE keepalive comment.
 *
 * Keepalive format: `:keepalive\n\n`
 */
export function isKeepalive(line: string): boolean {
  const trimmed = line.trim();
  return trimmed === ":keepalive" || trimmed === ":keepalive\n";
}

/**
 * Formats a MissionEvent as a complete SSE message.
 *
 * Output format:
 * ```
 * id: <event.id>
 * data: <single-line JSON>
 * ```
 * followed by double newline.
 */
export function formatSSEEvent(event: MissionEvent): string {
  const idLine = `id: ${event.id}`;
  const dataLine = `data: ${JSON.stringify(event)}`;
  return `${idLine}\n${dataLine}\n\n`;
}
