import {
	assertValidAccountingPrProps,
	assertValidTransition,
} from "./accounting-pr.validators";
import type {
	AccountingPrProps,
	AccountingPrStatus,
	PrSignature,
} from "./types";

export type {
	AccountingPrProps,
	AccountingPrStatus,
	PrSignature,
} from "./types";

export class AccountingPr {
	private constructor(private props: AccountingPrProps) {
		assertValidAccountingPrProps(props);
		Object.freeze(this);
	}

	static create(props: AccountingPrProps): AccountingPr {
		return new AccountingPr(props);
	}

	static fromPrimitives(data: Record<string, unknown>): AccountingPr {
		return new AccountingPr({
			id: data.id as string,
			companyId: data.companyId as string,
			prNumber: data.prNumber as number,
			title: data.title as string,
			...(data.description !== undefined
				? { description: data.description as string }
				: {}),
			status: (data.status ?? "DRAFT") as AccountingPrStatus,
			entries: (data.entries ?? []) as string[],
			evidenceIds: (data.evidenceIds ?? []) as string[],
			totalDebitCents: (data.totalDebitCents as number) ?? 0,
			totalCreditCents: (data.totalCreditCents as number) ?? 0,
			...(data.reviewerId !== undefined
				? { reviewerId: data.reviewerId as string }
				: {}),
			...(data.reviewedAt
				? { reviewedAt: new Date(data.reviewedAt as string) }
				: {}),
			...(data.reviewComment !== undefined
				? { reviewComment: data.reviewComment as string }
				: {}),
			approveSignerIds: (data.approveSignerIds ?? []) as string[],
			approveSignatures: (data.approveSignatures ?? []) as PrSignature[],
			...(data.createdById !== undefined
				? { createdById: data.createdById as string }
				: {}),
			createdAt: new Date(data.createdAt as string),
			updatedAt: new Date(data.updatedAt as string),
		});
	}

	// --- State Machine Transitions ---

	submitForReview(reviewerId?: string): AccountingPr {
		assertValidTransition(this.props.status, "PENDING_REVIEW");

		return new AccountingPr({
			...this.props,
			status: "PENDING_REVIEW",
			...(reviewerId !== undefined ? { reviewerId } : {}),
			updatedAt: new Date(),
		});
	}

	approve(signerId: string, comment?: string): AccountingPr {
		assertValidTransition(this.props.status, "APPROVED");

		const signature: PrSignature = {
			signerId,
			signedAt: new Date().toISOString(),
			...(comment !== undefined ? { comment } : {}),
		};

		return new AccountingPr({
			...this.props,
			status: "APPROVED",
			reviewedAt: new Date(),
			...(comment !== undefined ? { reviewComment: comment } : {}),
			approveSignerIds: [
				...new Set([...this.props.approveSignerIds, signerId]),
			],
			approveSignatures: [...this.props.approveSignatures, signature],
			updatedAt: new Date(),
		});
	}

	reject(reason: string): AccountingPr {
		assertValidTransition(this.props.status, "REJECTED");

		if (!reason || reason.trim().length === 0) {
			throw new Error("El motivo de rechazo es requerido");
		}

		return new AccountingPr({
			...this.props,
			status: "REJECTED",
			reviewComment: reason,
			reviewedAt: new Date(),
			updatedAt: new Date(),
		});
	}

	post(): AccountingPr {
		assertValidTransition(this.props.status, "POSTED");

		return new AccountingPr({
			...this.props,
			status: "POSTED",
			updatedAt: new Date(),
		});
	}

	addSignature(signerId: string, comment?: string): AccountingPr {
		if (this.props.status !== "PENDING_REVIEW") {
			throw new Error("Solo se pueden agregar firmas a PRs en revisión");
		}

		const signature: PrSignature = {
			signerId,
			signedAt: new Date().toISOString(),
			...(comment !== undefined ? { comment } : {}),
		};

		return new AccountingPr({
			...this.props,
			approveSignerIds: [
				...new Set([...this.props.approveSignerIds, signerId]),
			],
			approveSignatures: [...this.props.approveSignatures, signature],
			updatedAt: new Date(),
		});
	}

	canBeModified(): boolean {
		return this.props.status === "DRAFT";
	}

	equals(other: AccountingPr | null | undefined): boolean {
		if (!other) return false;
		return this.props.id === other.props.id;
	}

	get id(): string {
		return this.props.id;
	}
	get companyId(): string {
		return this.props.companyId;
	}
	get prNumber(): number {
		return this.props.prNumber;
	}
	get title(): string {
		return this.props.title;
	}
	get description(): string | undefined {
		return this.props.description;
	}
	get status(): AccountingPrStatus {
		return this.props.status;
	}
	get entries(): readonly string[] {
		return this.props.entries;
	}
	get evidenceIds(): readonly string[] {
		return this.props.evidenceIds;
	}
	get totalDebitCents(): number {
		return this.props.totalDebitCents;
	}
	get totalCreditCents(): number {
		return this.props.totalCreditCents;
	}
	get reviewerId(): string | undefined {
		return this.props.reviewerId;
	}
	get reviewedAt(): Date | undefined {
		return this.props.reviewedAt;
	}
	get reviewComment(): string | undefined {
		return this.props.reviewComment;
	}
	get approveSignerIds(): readonly string[] {
		return this.props.approveSignerIds;
	}
	get approveSignatures(): readonly PrSignature[] {
		return this.props.approveSignatures;
	}
	get createdById(): string | undefined {
		return this.props.createdById;
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
			companyId: this.props.companyId,
			prNumber: this.props.prNumber,
			title: this.props.title,
			description: this.props.description,
			status: this.props.status,
			entries: this.props.entries,
			evidenceIds: this.props.evidenceIds,
			totalDebitCents: this.props.totalDebitCents,
			totalCreditCents: this.props.totalCreditCents,
			reviewerId: this.props.reviewerId,
			reviewedAt: this.props.reviewedAt?.toISOString(),
			reviewComment: this.props.reviewComment,
			approveSignerIds: this.props.approveSignerIds,
			approveSignatures: this.props.approveSignatures,
			createdById: this.props.createdById,
			createdAt: this.props.createdAt.toISOString(),
			updatedAt: this.props.updatedAt.toISOString(),
		};
	}
}
