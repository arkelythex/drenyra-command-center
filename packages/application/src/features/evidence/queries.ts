export interface GetEvidenceByIdQuery {
	id: string;
	organizationId: number;
}

export interface ListPendingClassificationQuery {
	limit?: number;
	organizationId: number;
}

export interface GetEvidenceTimelineQuery {
	id: string;
	organizationId: number;
}
