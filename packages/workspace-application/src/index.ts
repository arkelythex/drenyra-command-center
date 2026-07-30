// ─── Barrel Exports — workspace-application ──────────────────────────────────

export {
	AUTHORITY_LEVEL,
	type AuthorityLevel,
	STATE_SOURCE,
	type StateSource,
	type AuthoritativeStateRecord,
	type AuthorityPrecedenceResult,
	type StateEvent,
	CURRENT_AUTHORITY_SCHEMA_VERSION,
} from "./authority/types";

export { shouldApplyState } from "./authority/precedence";

export { reduceExecutionState } from "./authority/reducer";

export {
	detectStaleRecords,
	reconcileUnknown,
	resolveCurrentState,
} from "./authority/stale";

export {
	type AuthorityStore,
	InMemoryAuthorityStore,
} from "./authority/store";
