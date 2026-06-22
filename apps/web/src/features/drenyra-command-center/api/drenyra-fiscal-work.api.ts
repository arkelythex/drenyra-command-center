import type {
	DrenyraFiscalWorkInspectEnvelope,
	DrenyraFiscalWorkInspectSourceSurface,
} from "@arkelythex/domain/drenyra";
import { api, getGovernanceAuditHeaders, getOrganizationId } from "@/lib/api";
import { unwrap } from "@/lib/api-helpers";
import { getCompanyContext } from "@/lib/company-context";
import { getActiveFiscalPeriod } from "@/lib/fiscal-period";

export type { DrenyraFiscalWorkInspectEnvelope };

export const DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY = "drenyra.fiscal-work.inspect" as const;

function fiscalWorkInspectHeaders(sourceSurface: DrenyraFiscalWorkInspectSourceSurface) {
	const organizationId = getOrganizationId();
	if (!organizationId) {
		throw new Error("Drenyra requires an explicit organization id");
	}
	const companyContext = getCompanyContext();
	return {
		headers: {
			...getGovernanceAuditHeaders(),
			"x-organization-id": organizationId,
			"x-company-id": companyContext.companyId,
			"x-company-ruc": companyContext.ruc,
			"x-fiscal-period": getActiveFiscalPeriod(),
			"x-drenyra-capability-grant": DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
			"x-drenyra-source-surface": sourceSurface,
		},
	};
}

export async function inspectFiscalWorkItem(
	workItemId: string,
	sourceSurface: DrenyraFiscalWorkInspectSourceSurface = "web",
): Promise<DrenyraFiscalWorkInspectEnvelope> {
	const envelope = await unwrap(
		api.api.drenyra["fiscal-work"]({ id: workItemId }).inspect.get(
			fiscalWorkInspectHeaders(sourceSurface),
		),
	);
	if (!envelope) {
		throw new Error("No se pudo inspeccionar el trabajo fiscal");
	}
	return envelope;
}

export const inspectFiscalWork = inspectFiscalWorkItem;
