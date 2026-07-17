/**
 * Platform-wide event types.
 *
 * Convention: <domain>.<entity>.<action>
 *   core.client.registered
 *   drenyra.invoice.created
 *   administracion.contract.signed
 *   salud.appointment.scheduled
 *   agricultura.crop.harvested
 *   drones.mission.completed
 */
export type PlatformEventType = string & {
	readonly __brand: "PlatformEventType";
};

/** Well-known event types for type-safe usage */
export const PlatformEventTypes = {
	ClientRegistered: "core.client.registered" as PlatformEventType,
	OrganizationCreated: "core.organization.created" as PlatformEventType,
	UserInvited: "core.user.invited" as PlatformEventType,
	InvoiceCreated: "drenyra.invoice.created" as PlatformEventType,
	PaymentReceived: "drenyra.payment.received" as PlatformEventType,
	ContractSigned: "administracion.contract.signed" as PlatformEventType,
	EmployeeHired: "administracion.employee.hired" as PlatformEventType,
	CropHarvested: "agricultura.crop.harvested" as PlatformEventType,
	FarmRegistered: "agricultura.farm.registered" as PlatformEventType,
	AppointmentScheduled: "salud.appointment.scheduled" as PlatformEventType,
	PatientRegistered: "salud.patient.registered" as PlatformEventType,
	MissionCompleted: "drones.mission.completed" as PlatformEventType,
	TelemetryReceived: "drones.telemetry.received" as PlatformEventType,
	OsAgentExecuted: "os.agent.executed" as PlatformEventType,
	OsApprovalRequested: "os.approval.requested" as PlatformEventType,
	OsApprovalResolved: "os.approval.resolved" as PlatformEventType,
} as const;

/** Base structure for every event in the platform */
export interface PlatformEvent<T = unknown> {
	id: string;
	type: PlatformEventType;
	payload: T;
	source: string;
	timestamp: Date;
	correlationId: string;
	causationId?: string;
}

/** Event handler function */
export type PlatformEventHandler<T = unknown> = (
	event: PlatformEvent<T>,
) => Promise<void> | void;
