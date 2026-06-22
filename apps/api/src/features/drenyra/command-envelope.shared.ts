import type { DrenyraActorContext } from "@arkelythex/application/drenyra";

export interface CommandEnvelopeInputBase {
	caseId?: string;
	sourceRef?: string;
	traceId: string;
}

export function toDrenyraCommandScope(context: DrenyraActorContext) {
	return {
		companyId: context.companyId,
		companyRuc: context.companyRuc,
		organizationId: context.organizationId,
		period: context.period,
		countryCode: "PE" as const,
	};
}
