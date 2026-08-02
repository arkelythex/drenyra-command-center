/**
 * @drenyra/mission-domain — mission-errors ADAPTER SHIM.
 *
 * The canonical mission error taxonomy now lives in `drenyra-ai` (released
 * v0.0.1-prealpha.1): the 31-code `MissionErrorCode`, the `MissionError` class,
 * and `isMissionError`. This file re-exports them from the single authority —
 * the local 13-code taxonomy (with domain-only `FORBIDDEN` and divergent
 * HARNESS_TIMEOUT→500) is retired; consumers aligned to the canonical codes.
 *
 * Fiscal convention: monetary values in the Drenyra ecosystem are BigInt cents;
 * no float is ever used for money; status codes are JSON integers, never
 * floats.
 */

export {
	isMissionError,
	MissionError,
	MissionErrorCode,
} from "drenyra-ai/missions";
