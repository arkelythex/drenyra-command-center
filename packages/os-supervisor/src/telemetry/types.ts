/**
 * ARKELYTHEX OS — OpenTelemetry types
 */

/** Attributes shared across all OS spans */
export interface OSSpanAttributes {
	/** Vertical identifier (andino, admin, edge, kuse, drenyra) */
	"os.vertical"?: string;
	/** Agent or component ID */
	"os.agent_id"?: string;
	/** Tenant / organization */
	"os.tenant_id"?: string;
	/** Trace ID for correlation */
	"os.correlation_id"?: string;
	/** Approval level for gated operations */
	"os.approval_level"?: string;
	/** Approval request ID */
	"os.approval_request_id"?: string;
}

/** Configuration for the OS tracer */
export interface TelemetryConfig {
	/** Service name reported to OTel (default: "arkelythex-os") */
	serviceName?: string;
	/** OTLP HTTP endpoint (default: "http://localhost:4318/v1/traces") */
	endpoint?: string;
	/** Environment label (default: "development") */
	environment?: string;
}
