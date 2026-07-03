import {
	assertThreadCanActivate,
	assertThreadCanSubmitForReview,
	assertValidDate,
	assertValidThreadProps,
	assertValidTransition,
} from "./thread.validators";
import type {
	ThreadAgentAssignmentProps,
	ThreadEnvironment,
	ThreadPriority,
	ThreadProps,
	ThreadStatus,
	ThreadTaskProps,
} from "./types";

export type {
	ThreadAgentAssignmentProps,
	ThreadEnvironment,
	ThreadPriority,
	ThreadProps,
	ThreadStatus,
	ThreadTaskProps,
} from "./types";

export class Thread {
	private constructor(private props: ThreadProps) {
		assertValidThreadProps(props);
		Object.freeze(this);
	}

	static create(props: ThreadProps): Thread {
		return new Thread(props);
	}

	static fromPrimitives(data: Record<string, unknown>): Thread {
		return new Thread({
			id: data.id as string,
			companyId: data.companyId as string,
			title: data.title as string,
			description: data.description as string | undefined,
			status: (data.status ?? "DRAFT") as ThreadStatus,
			environment: (data.environment ?? "local") as ThreadEnvironment,
			period: data.period as string | undefined,
			priority: (data.priority ?? "MEDIUM") as ThreadPriority,
			tags: (data.tags ?? []) as string[],
			tasks: (data.tasks ?? []) as ThreadTaskProps[],
			agentAssignments: (data.agentAssignments ?? []) as ThreadAgentAssignmentProps[],
			evidenceIds: (data.evidenceIds ?? []) as string[],
			createdById: data.createdById as string,
			createdAt: assertValidDate(data.createdAt as string, "createdAt"),
			updatedAt: assertValidDate(data.updatedAt as string, "updatedAt"),
			closedAt: data.closedAt
				? assertValidDate(data.closedAt as string, "closedAt")
				: undefined,
			closedById: data.closedById as string | undefined,
			closeNote: data.closeNote as string | undefined,
		});
	}

	// --- State Machine Transitions ---

	activate(): Thread {
		assertValidTransition(this.props.status, "ACTIVE");
		assertThreadCanActivate(this.props.tasks);

		return new Thread({
			...this.props,
			status: "ACTIVE",
			updatedAt: new Date(),
		});
	}

	block(reason: string): Thread {
		assertValidTransition(this.props.status, "BLOCKED");

		if (!reason || reason.trim().length === 0) {
			throw new Error("A reason is required to block a thread");
		}

		return new Thread({
			...this.props,
			status: "BLOCKED",
			description: reason,
			updatedAt: new Date(),
		});
	}

	unblock(): Thread {
		assertValidTransition(this.props.status, "ACTIVE");

		return new Thread({
			...this.props,
			status: "ACTIVE",
			updatedAt: new Date(),
		});
	}

	submitForReview(): Thread {
		assertValidTransition(this.props.status, "PENDING_REVIEW");
		assertThreadCanSubmitForReview(this.props.tasks);

		return new Thread({
			...this.props,
			status: "PENDING_REVIEW",
			updatedAt: new Date(),
		});
	}

	awaitInfo(): Thread {
		assertValidTransition(this.props.status, "AWAITING_INFO");

		return new Thread({
			...this.props,
			status: "AWAITING_INFO",
			updatedAt: new Date(),
		});
	}

	provideInfo(returnTo: "PENDING_REVIEW" | "ACTIVE"): Thread {
		assertValidTransition(this.props.status, returnTo);

		return new Thread({
			...this.props,
			status: returnTo,
			updatedAt: new Date(),
		});
	}

	review(approved: boolean): Thread {
		if (approved) {
			assertValidTransition(this.props.status, "REVIEWED");

			return new Thread({
				...this.props,
				status: "REVIEWED",
				updatedAt: new Date(),
			});
		}

		assertValidTransition(this.props.status, "ACTIVE");

		return new Thread({
			...this.props,
			status: "ACTIVE",
			updatedAt: new Date(),
		});
	}

	close(userId: string, note?: string): Thread {
		assertValidTransition(this.props.status, "CLOSED");

		if (!userId || userId.trim().length === 0) {
			throw new Error("A userId is required to close a thread");
		}

		return new Thread({
			...this.props,
			status: "CLOSED",
			closedById: userId,
			closeNote: note,
			closedAt: new Date(),
			updatedAt: new Date(),
		});
	}

	// --- Queries ---

	canBeModified(): boolean {
		return this.props.status !== "CLOSED";
	}

	equals(other: Thread | null | undefined): boolean {
		if (!other) return false;
		return this.props.id === other.props.id;
	}

	// --- Getters ---

	get id(): string {
		return this.props.id;
	}
	get companyId(): string {
		return this.props.companyId;
	}
	get title(): string {
		return this.props.title;
	}
	get description(): string | undefined {
		return this.props.description;
	}
	get status(): ThreadStatus {
		return this.props.status;
	}
	get environment(): ThreadEnvironment {
		return this.props.environment;
	}
	get period(): string | undefined {
		return this.props.period;
	}
	get priority(): ThreadPriority {
		return this.props.priority;
	}
	get tags(): readonly string[] {
		return this.props.tags;
	}
	get tasks(): readonly ThreadTaskProps[] {
		return this.props.tasks;
	}
	get agentAssignments(): readonly ThreadAgentAssignmentProps[] {
		return this.props.agentAssignments;
	}
	get evidenceIds(): readonly string[] {
		return this.props.evidenceIds;
	}
	get createdById(): string {
		return this.props.createdById;
	}
	get createdAt(): Date {
		return this.props.createdAt;
	}
	get updatedAt(): Date {
		return this.props.updatedAt;
	}
	get closedAt(): Date | undefined {
		return this.props.closedAt;
	}
	get closedById(): string | undefined {
		return this.props.closedById;
	}
	get closeNote(): string | undefined {
		return this.props.closeNote;
	}

	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			companyId: this.props.companyId,
			title: this.props.title,
			description: this.props.description,
			status: this.props.status,
			environment: this.props.environment,
			period: this.props.period,
			priority: this.props.priority,
			tags: this.props.tags,
			tasks: this.props.tasks,
			agentAssignments: this.props.agentAssignments,
			evidenceIds: this.props.evidenceIds,
			createdById: this.props.createdById,
			createdAt: this.props.createdAt.toISOString(),
			updatedAt: this.props.updatedAt.toISOString(),
			closedAt: this.props.closedAt?.toISOString(),
			closedById: this.props.closedById,
			closeNote: this.props.closeNote,
		};
	}
}
