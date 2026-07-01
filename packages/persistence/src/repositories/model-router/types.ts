import type {
	capabilityRoutingRules,
	modelRegistrations,
	routingAuditLog,
} from "../../schema/model-router.schema";

export type ModelRegistrationRow = typeof modelRegistrations.$inferSelect;
export type NewModelRegistrationRow = typeof modelRegistrations.$inferInsert;

export type CapabilityRoutingRuleRow =
	typeof capabilityRoutingRules.$inferSelect;
export type NewCapabilityRoutingRuleRow =
	typeof capabilityRoutingRules.$inferInsert;

export type RoutingAuditLogRow = typeof routingAuditLog.$inferSelect;
export type NewRoutingAuditLogRow = typeof routingAuditLog.$inferInsert;
