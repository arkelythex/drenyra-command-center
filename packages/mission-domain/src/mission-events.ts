/**
 * @drenyra/mission-domain — mission-events ADAPTER SHIM.
 *
 * The canonical mission event types + SSE helpers live in `drenyra-ai`
 * (released v0.0.1-prealpha.1). Explicit names only.
 *
 * Fiscal convention: monetary values in the Drenyra ecosystem are BigInt cents;
 * no float is ever used for money; sequence numbers are JSON integers, never
 * floats.
 */

export type { MissionEvent } from "drenyra-ai/missions";
export {
	formatSSEEvent,
	isKeepalive,
	MissionEventType,
	parseSSEEvent,
} from "drenyra-ai/missions";
