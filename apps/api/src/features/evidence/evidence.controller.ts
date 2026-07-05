import {
	GetEvidenceHandler,
	GetEvidenceTimelineHandler,
	ListPendingClassificationHandler,
	RegisterEvidenceHandler,
} from "@drenyra/application/features/evidence";
import { Evidence } from "@drenyra/domain";
import { evidenceRepository } from "./infrastructure/evidence-repository.adapter";
import type {
	ClassifyEvidenceBody,
	EvidenceListQuery,
	UploadEvidenceBody,
} from "./types";

const registerHandler = new RegisterEvidenceHandler(evidenceRepository);
const getEvidenceHandler = new GetEvidenceHandler(evidenceRepository);
const timelineHandler = new GetEvidenceTimelineHandler(evidenceRepository);
const listHandler = new ListPendingClassificationHandler(evidenceRepository);

export const evidenceController = {
	async upload(body: UploadEvidenceBody) {
		return registerHandler.execute(body);
	},

	async list(query: EvidenceListQuery) {
		const all = await evidenceRepository.findAll({
			organizationId: query.organizationId,
			status: query.status,
			evidenceType: query.evidenceType,
			source: query.source,
			dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
			dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
			limit: query.limit,
			offset: query.offset,
		});
		const total = await evidenceRepository.count({
			organizationId: query.organizationId,
			status: query.status,
			evidenceType: query.evidenceType,
			source: query.source,
			dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
			dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
		});
		const items = all.map((e) => ({
			id: e.id,
			organizationId: e.organizationId,
			companyId: e.companyId,
			filename: e.filename,
			mimeType: e.mimeType,
			sizeBytes: e.sizeBytes,
			hash: e.hash,
			evidenceType: e.evidenceType,
			source: e.source,
			status: e.status,
			metadata: e.metadata,
			extractedData: e.extractedData,
			classifierResult: e.classifierResult,
			validatedAt: e.validatedAt?.toISOString(),
			validatedBy: e.validatedBy,
			errorMessage: e.errorMessage,
			tags: e.tags ? [...e.tags] : undefined,
			createdAt: e.createdAt.toISOString(),
			updatedAt: e.updatedAt.toISOString(),
		}));
		return { items, total };
	},

	async getDetail(id: string, organizationId: number) {
		const evidence = await getEvidenceHandler.execute({
			id,
			organizationId,
		});
		if (!evidence) return null;

		const timeline = await timelineHandler.execute({
			id,
			organizationId,
		});

		return { evidence, timeline };
	},

	async classify(
		id: string,
		organizationId: number,
		body: ClassifyEvidenceBody,
	) {
		const entity = await evidenceRepository.findForOrganization(
			id,
			organizationId,
		);
		if (!entity) return null;

		const updated = entity.markAsClassified(body.evidenceType);
		await evidenceRepository.update(updated);

		return {
			id: updated.id,
			organizationId: updated.organizationId,
			companyId: updated.companyId,
			filename: updated.filename,
			mimeType: updated.mimeType,
			sizeBytes: updated.sizeBytes,
			hash: updated.hash,
			evidenceType: updated.evidenceType,
			source: updated.source,
			status: updated.status,
			metadata: updated.metadata,
			extractedData: updated.extractedData,
			classifierResult: updated.classifierResult,
			validatedAt: updated.validatedAt?.toISOString(),
			validatedBy: updated.validatedBy,
			errorMessage: updated.errorMessage,
			tags: updated.tags ? [...updated.tags] : undefined,
			createdAt: updated.createdAt.toISOString(),
			updatedAt: updated.updatedAt.toISOString(),
		};
	},
};
