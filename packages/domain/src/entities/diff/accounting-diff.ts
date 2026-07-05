import type { DiffChange } from "./diff-change";
import type { DiffStatus } from "./diff-status";
import type { DiffType } from "./diff-type";
import type { DiffId, DiffImpact } from "./index";

export interface AccountingDiffProps {
	id: DiffId;
	threadId: string;
	type: DiffType;
	title: string;
	description: string;
	changes: DiffChange[];
	impact: DiffImpact;
	createdBy: string;
	evidenceIds: string[];
	reviewerId?: string;
	rejectionReason?: string;
	pendingQuestion?: string;
}

export class AccountingDiff {
	private constructor(
		public readonly id: DiffId,
		public readonly threadId: string,
		public readonly type: DiffType,
		public readonly title: string,
		public readonly description: string,
		public readonly changes: readonly DiffChange[],
		public readonly impact: DiffImpact,
		public readonly status: DiffStatus,
		public readonly createdBy: string,
		public readonly evidenceIds: readonly string[],
		public readonly createdAt: Date,
		public readonly updatedAt: Date,
		public readonly reviewerId?: string,
		public readonly rejectionReason?: string,
		public readonly pendingQuestion?: string,
	) {}

	static create(props: AccountingDiffProps): AccountingDiff {
		return new AccountingDiff(
			props.id,
			props.threadId,
			props.type,
			props.title,
			props.description,
			props.changes,
			props.impact,
			"pending",
			props.createdBy,
			props.evidenceIds,
			new Date(),
			new Date(),
			undefined,
			undefined,
			undefined,
		);
	}

	approve(reviewerId: string): AccountingDiff {
		this.assertStatus("pending");
		return new AccountingDiff(
			this.id,
			this.threadId,
			this.type,
			this.title,
			this.description,
			this.changes,
			this.impact,
			"approved",
			this.createdBy,
			this.evidenceIds,
			this.createdAt,
			new Date(),
			reviewerId,
		);
	}

	reject(reviewerId: string, reason: string): AccountingDiff {
		this.assertStatus("pending");
		return new AccountingDiff(
			this.id,
			this.threadId,
			this.type,
			this.title,
			this.description,
			this.changes,
			this.impact,
			"rejected",
			this.createdBy,
			this.evidenceIds,
			this.createdAt,
			new Date(),
			reviewerId,
			reason,
		);
	}

	requestInfo(question: string): AccountingDiff {
		this.assertStatus("pending");
		return new AccountingDiff(
			this.id,
			this.threadId,
			this.type,
			this.title,
			this.description,
			this.changes,
			this.impact,
			"info_requested",
			this.createdBy,
			this.evidenceIds,
			this.createdAt,
			new Date(),
			undefined,
			undefined,
			question,
		);
	}

	canTransitionTo(target: DiffStatus): boolean {
		const allowed: Record<DiffStatus, DiffStatus[]> = {
			pending: ["approved", "rejected", "info_requested"],
			approved: [],
			rejected: [],
			info_requested: ["approved", "rejected"],
		};
		return allowed[this.status].includes(target);
	}

	private assertStatus(expected: DiffStatus): void {
		if (this.status !== expected) {
			throw new Error(
				`Invalid transition: cannot modify diff in status "${this.status}"`,
			);
		}
	}

	toJSON(): Record<string, unknown> {
		return {
			id: this.id,
			threadId: this.threadId,
			type: this.type,
			title: this.title,
			description: this.description,
			changes: this.changes,
			impact: this.impact,
			status: this.status,
			createdBy: this.createdBy,
			evidenceIds: this.evidenceIds,
			reviewerId: this.reviewerId,
			rejectionReason: this.rejectionReason,
			pendingQuestion: this.pendingQuestion,
			createdAt: this.createdAt.toISOString(),
			updatedAt: this.updatedAt.toISOString(),
		};
	}
}
