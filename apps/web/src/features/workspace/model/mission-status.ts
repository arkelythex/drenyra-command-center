/**
 * DEPRECATED — use @drenyra/mission-domain instead.
 *
 * This file is kept as a backward-compatible re-export wrapper.
 * New code MUST import from @drenyra/mission-domain directly.
 *
 * Migration path:
 *   import { AccountingMissionStatus } from "../model/mission-status"
 *   becomes:
 *   import { AccountingMissionStatus } from "@drenyra/mission-domain"
 *
 * Scheduled for removal: after all consumers migrate (post-PR3).
 */

export {
  AccountingMissionStatus,
  VALID_TRANSITIONS,
  TERMINAL_STATES,
  transition,
  isRunnable,
  isAwaitingApproval,
  isTerminal,
} from "@drenyra/mission-domain";
