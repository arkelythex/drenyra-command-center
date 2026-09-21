/**
 * Compatibility surface for the canonical drenyra-ai protocol versioning
 * contract: capabilities, compatibility, and feature negotiation. Enables
 * multi-surface clients (CLI, web, desktop, mobile) with different release
 * cycles to negotiate supported features with the server.
 */
export type {
	/** Server capabilities response, returned by the `/capabilities` endpoint. */
	CapabilitiesResponse,
	/** One entry of `SUPPORTED_FEATURES`, in `<domain>.<action>.<mechanism>.v<major>` form. */
	ProtocolFeature,
} from "drenyra-ai/missions";
export {
	/** Compares two semver versions. */
	compareVersions,
	/** Returns the current server capabilities. */
	getCapabilities,
	/** Checks if a specific feature is supported. */
	hasFeature,
	/** Checks if a client version is compatible with the server. */
	isClientCompatible,
	/** Minimum supported client version for this server version. */
	MINIMUM_CLIENT_VERSION,
	/** Current protocol version. Follows semver MAJOR.minor; MAJOR bumps break the wire protocol. */
	PROTOCOL_VERSION,
	/** Granular protocol capabilities, evolvable one capability at a time. */
	SUPPORTED_FEATURES,
} from "drenyra-ai/missions";
