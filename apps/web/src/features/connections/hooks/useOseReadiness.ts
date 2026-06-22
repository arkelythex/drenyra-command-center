import { useQuery } from "@tanstack/react-query";
import { getGovernanceAuditHeaders } from "@/lib/api";
import { electronicInvoicingTreatyClient } from "../api/electronic-invoicing-treaty-client";

export interface OseReadinessPayload {
	status: "ready" | "config_invalid" | "provider_offline" | "simulation";
	provider: string;
	environment: "sandbox" | "production";
	simulationMode: boolean;
	online: boolean;
	message: string;
	configuration: {
		valid: boolean;
		missing: string[];
		errors: string[];
		hasApiUrl: boolean;
		hasApiToken: boolean;
		hasCompanyRuc: boolean;
		hasUsername: boolean;
		hasWebhookSecret: boolean;
	};
}

interface OseReadinessResponse {
	success: boolean;
	data: OseReadinessPayload;
}

export function useOseReadiness() {
	return useQuery({
		queryKey: ["connections", "ose-readiness"],
		queryFn: async () => {
			const response = await electronicInvoicingTreatyClient.ose.readiness.get({
				headers: getGovernanceAuditHeaders(),
			});
			const payload = response.data as OseReadinessResponse | null;

			if (!payload?.success) {
				throw new Error("OSE_READINESS_UNAVAILABLE");
			}

			return payload.data;
		},
		staleTime: 60_000,
		retry: 1,
	});
}
