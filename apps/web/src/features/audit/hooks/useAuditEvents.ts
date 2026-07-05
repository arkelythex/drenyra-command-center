import { useQuery } from "@tanstack/react-query";
import { type AuditEvent, auditApi } from "../api/audit.api";

export const auditKeys = {
	all: ["audit-events"] as const,
	filtered: (period?: string, search?: string) =>
		["audit-events", period, search] as const,
};

export function useAuditEvents(period?: string, search?: string) {
	return useQuery({
		queryKey: auditKeys.filtered(period, search),
		queryFn: () => auditApi.getEvents({ period, search }),
	});
}
