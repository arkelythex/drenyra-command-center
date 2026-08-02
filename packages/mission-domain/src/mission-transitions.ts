/**
 * @drenyra/mission-domain — mission-transitions ADAPTER SHIM.
 *
 * The canonical transition guards now live in `drenyra-ai` (released
 * v0.0.1-prealpha.1). Explicit names only — the divergent legacy types stay
 * local until consumers are aligned.
 *
 * Fiscal convention: monetary values in the Drenyra ecosystem are BigInt cents;
 * no float is ever used for money; version/sequence numbers are JSON integers,
 * never floats.
 */

export {
	guardTerminal,
	isValidRecoveryPath,
	reconcileTransition,
	validateTransition,
} from "drenyra-ai/missions";
