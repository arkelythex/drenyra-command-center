import type {
	DrenyraBrainSourceSurface,
	DrenyraFiscalScope,
} from "@arkelythex/domain/drenyra";

export interface CreateDrenyraBrainThreadInput {
	title: string;
	fiscalScope: DrenyraFiscalScope;
	sourceSurface: DrenyraBrainSourceSurface;
	createdBy: string;
	linkedCaseId?: string;
	linkedMissionId?: string;
}

export interface StartDrenyraBrainTurnInput {
	threadId: string;
	prompt: string;
	fiscalScope: DrenyraFiscalScope;
	sourceSurface: DrenyraBrainSourceSurface;
	createdBy: string;
}

export interface ListDrenyraBrainThreadsInput {
	fiscalScope: DrenyraFiscalScope;
}

export interface ListDrenyraBrainItemsInput {
	threadId: string;
	fiscalScope: DrenyraFiscalScope;
}

export function isSameFiscalScope(
	left: DrenyraFiscalScope,
	right: DrenyraFiscalScope,
): boolean {
	return left.organizationId === right.organizationId
		&& left.companyId === right.companyId
		&& left.companyRuc === right.companyRuc
		&& left.period === right.period
		&& left.countryCode === right.countryCode;
}
