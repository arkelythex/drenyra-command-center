import { computeAuditHash } from "../../audit-ledger/compute-audit-hash";
import type {
	EvidenceAuditTrailEntry,
	EvidencePrimitiveData,
	EvidenceProps,
	EvidenceSource,
	EvidenceStatus,
	EvidenceType,
	HashChainEntry,
} from "./types";
import {
	validateEvidenceBusinessRules,
	validateStatusTransition,
} from "./validators";

export class Evidence {
	private constructor(private props: EvidenceProps) {
		validateEvidenceBusinessRules(this.props);
		Object.freeze(this);
	}

	static create(props: EvidenceProps): Evidence {
		return new Evidence(props);
	}

	static fromPrimitives(data: EvidencePrimitiveData): Evidence {
		const props: EvidenceProps = {
			id: data.id,
			organizationId: data.organizationId,
			companyId: data.companyId,
			filename: data.filename,
			mimeType: data.mimeType,
			sizeBytes: Number(data.sizeBytes),
			hash: data.hash,
			hashChain: data.hashChain
				? {
						hash: data.hashChain.hash,
						prevHash: data.hashChain.prevHash,
						timestamp: data.hashChain.timestamp,
					}
				: undefined,
			evidenceType: data.evidenceType as EvidenceType,
			source: data.source as EvidenceSource,
			status: data.status as EvidenceStatus,
			metadata: data.metadata,
			extractedData: data.extractedData,
			classifierResult: data.classifierResult,
			validatedAt: data.validatedAt ? new Date(data.validatedAt) : undefined,
			validatedBy: data.validatedBy,
			errorMessage: data.errorMessage,
			tags: data.tags,
			createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
			updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
		};

		return new Evidence(props);
	}

	markAsExtracting(): Evidence {
		validateStatusTransition(this.props.status, "EXTRACTING");

		return new Evidence({
			...this.props,
			status: "EXTRACTING",
			updatedAt: new Date(),
		});
	}

	markAsClassified(evidenceType: EvidenceType): Evidence {
		validateStatusTransition(this.props.status, "CLASSIFIED");

		return new Evidence({
			...this.props,
			status: "CLASSIFIED",
			evidenceType,
			updatedAt: new Date(),
		});
	}

	markAsValidated(validatedBy: string): Evidence {
		validateStatusTransition(this.props.status, "VALIDATED");

		return new Evidence({
			...this.props,
			status: "VALIDATED",
			validatedBy,
			validatedAt: new Date(),
			updatedAt: new Date(),
		});
	}

	markAsRejected(reason: string): Evidence {
		validateStatusTransition(this.props.status, "REJECTED");

		return new Evidence({
			...this.props,
			status: "REJECTED",
			errorMessage: reason,
			updatedAt: new Date(),
		});
	}

	markAsError(message: string): Evidence {
		validateStatusTransition(this.props.status, "ERROR");

		return new Evidence({
			...this.props,
			status: "ERROR",
			errorMessage: message,
			updatedAt: new Date(),
		});
	}

	async updateHashChain(prevHash: string | null): Promise<Evidence> {
		const payload: Record<string, unknown> = {
			id: this.props.id,
			filename: this.props.filename,
			hash: this.props.hash,
			status: this.props.status,
			evidenceType: this.props.evidenceType,
		};

		const newHash = await computeAuditHash(payload, prevHash);

		const chainEntry: HashChainEntry = {
			hash: newHash,
			prevHash,
			timestamp: new Date().toISOString(),
		};

		return new Evidence({
			...this.props,
			hashChain: chainEntry,
			updatedAt: new Date(),
		});
	}

	equals(other: Evidence | null | undefined): boolean {
		if (!other) {
			return false;
		}
		return this.props.id === other.props.id;
	}

	get id(): string {
		return this.props.id;
	}

	get organizationId(): string {
		return this.props.organizationId;
	}

	get companyId(): string | undefined {
		return this.props.companyId;
	}

	get filename(): string {
		return this.props.filename;
	}

	get mimeType(): string {
		return this.props.mimeType;
	}

	get sizeBytes(): number {
		return this.props.sizeBytes;
	}

	get hash(): string {
		return this.props.hash;
	}

	get hashChain(): HashChainEntry | undefined {
		return this.props.hashChain;
	}

	get evidenceType(): EvidenceType {
		return this.props.evidenceType;
	}

	get source(): EvidenceSource {
		return this.props.source;
	}

	get status(): EvidenceStatus {
		return this.props.status;
	}

	get metadata(): Record<string, unknown> | undefined {
		return this.props.metadata;
	}

	get extractedData(): Record<string, unknown> | undefined {
		return this.props.extractedData;
	}

	get classifierResult(): Record<string, unknown> | undefined {
		return this.props.classifierResult;
	}

	get validatedAt(): Date | undefined {
		return this.props.validatedAt;
	}

	get validatedBy(): string | undefined {
		return this.props.validatedBy;
	}

	get errorMessage(): string | undefined {
		return this.props.errorMessage;
	}

	get tags(): readonly string[] | undefined {
		return this.props.tags;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			organizationId: this.props.organizationId,
			companyId: this.props.companyId,
			filename: this.props.filename,
			mimeType: this.props.mimeType,
			sizeBytes: this.props.sizeBytes,
			hash: this.props.hash,
			hashChain: this.props.hashChain,
			evidenceType: this.props.evidenceType,
			source: this.props.source,
			status: this.props.status,
			metadata: this.props.metadata,
			extractedData: this.props.extractedData,
			classifierResult: this.props.classifierResult,
			validatedAt: this.props.validatedAt?.toISOString(),
			validatedBy: this.props.validatedBy,
			errorMessage: this.props.errorMessage,
			tags: this.props.tags,
			createdAt: this.props.createdAt.toISOString(),
			updatedAt: this.props.updatedAt.toISOString(),
		};
	}
}
