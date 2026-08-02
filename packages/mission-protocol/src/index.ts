/**
 * @drenyra/mission-protocol — ADAPTER SHIM.
 *
 * The canonical mission protocol now lives in `drenyra-ai` (the standalone
 * Verifiable Accounting Agent Ecosystem runtime), released at
 * v0.0.1-prealpha.1 (GitHub Release tarball). This package keeps its name so
 * consumers (`mission-client`, `mission-domain`, apps) do not change imports,
 * but ALL implementation was removed — there is exactly ONE authority.
 *
 * Contract: https://github.com/arkelythex/drenyra-ai/blob/v0.0.1-prealpha.1/contracts/mission-protocol.md
 *
 * Fiscal convention: monetary values in the Drenyra ecosystem are BigInt cents;
 * no float is ever used for money; version/sequence numbers are JSON integers,
 * never floats.
 */

export * from "drenyra-ai/missions";
