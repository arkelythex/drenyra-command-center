import { Evidence } from "@drenyra/domain";
import type { EvidenceRepository } from "@drenyra/domain/repositories/evidence.repository";
import type { EvidenceClassifierAgent } from "../ai/evidence-classifier";
import { validateWorkerScope } from "./scope-validator";

export interface DocumentIngestionEvent {
	documentId: string;
	organizationId: string;
	companyId?: string;
	filename: string;
	mimeType: string;
	sizeBytes: number;
	hash: string;
	source: "UPLOAD" | "EMAIL" | "API" | "SYNC";
	metadata?: Record<string, unknown>;
}

export interface IngestionResult {
	evidenceId: string;
	status: "CLASSIFIED" | "ERROR";
	classification?: Record<string, unknown>;
	error?: string;
}

export class EvidenceIngestionWorker {
	constructor(
		private readonly evidenceRepository: EvidenceRepository,
		private readonly classifier: EvidenceClassifierAgent,
	) {}

	async processEvent(event: DocumentIngestionEvent): Promise<IngestionResult> {
		// Perimeter security: validate scope before any business logic
		validateWorkerScope(event as unknown as Record<string, unknown>, "tenant");

		const timestamp = new Date();

		const evidence = Evidence.create({
			id: event.documentId,
			organizationId: event.organizationId,
			companyId: event.companyId,
			filename: event.filename,
			mimeType: event.mimeType,
			sizeBytes: event.sizeBytes,
			hash: event.hash,
			evidenceType: "OTHER",
			source: event.source as Parameters<typeof Evidence.create>[0]["source"],
			status: "UPLOADED",
			metadata: event.metadata,
			createdAt: timestamp,
			updatedAt: timestamp,
		});

		try {
			const orgId = Number(event.organizationId);
			await this.evidenceRepository.saveForOrganization(evidence, orgId);

			const extracting = evidence.markAsExtracting();
			await this.evidenceRepository.updateForOrganization(extracting, orgId);

			const classification = await this.classifier.classify({
				evidenceId: extracting.id,
				filename: extracting.filename,
				mimeType: extracting.mimeType,
				sizeBytes: extracting.sizeBytes,
				contentHash: extracting.hash,
				metadata: extracting.metadata,
			});

			const enriched = Evidence.create({
				id: extracting.id,
				organizationId: extracting.organizationId,
				companyId: extracting.companyId,
				filename: extracting.filename,
				mimeType: extracting.mimeType,
				sizeBytes: extracting.sizeBytes,
				hash: extracting.hash,
				evidenceType: classification.evidenceType as Parameters<
					typeof Evidence.create
				>[0]["evidenceType"],
				source: extracting.source,
				status: "CLASSIFIED",
				classifierResult: classification as unknown as Record<string, unknown>,
				metadata: extracting.metadata,
				tags: extracting.tags ? [...extracting.tags] : undefined,
				createdAt: extracting.createdAt,
				updatedAt: new Date(),
			});

			await this.evidenceRepository.updateForOrganization(enriched, orgId);

			return {
				evidenceId: enriched.id,
				status: "CLASSIFIED",
				classification: classification as unknown as Record<string, unknown>,
			};
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unknown ingestion error";

			try {
				const orgId = Number(event.organizationId);
				const errored = Evidence.create({
					id: evidence.id,
					organizationId: evidence.organizationId,
					companyId: evidence.companyId,
					filename: evidence.filename,
					mimeType: evidence.mimeType,
					sizeBytes: evidence.sizeBytes,
					hash: evidence.hash,
					evidenceType: evidence.evidenceType,
					source: evidence.source,
					status: "ERROR",
					errorMessage: message,
					metadata: evidence.metadata,
					tags: evidence.tags ? [...evidence.tags] : undefined,
					createdAt: evidence.createdAt,
					updatedAt: new Date(),
				});
				await this.evidenceRepository.updateForOrganization(errored, orgId);
			} catch {
				// Log but don't fail — primary error is already captured
			}

			return { evidenceId: evidence.id, status: "ERROR", error: message };
		}
	}
}
