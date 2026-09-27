import type { ThreadAgentAssignmentProps, ThreadEnvironment, ThreadPriority, ThreadProps, ThreadStatus, ThreadTaskProps } from "./types";
export type { ThreadAgentAssignmentProps, ThreadEnvironment, ThreadPriority, ThreadProps, ThreadStatus, ThreadTaskProps, } from "./types";
export declare class Thread {
    private props;
    private constructor();
    static create(props: ThreadProps): Thread;
    static fromPrimitives(data: Record<string, unknown>): Thread;
    activate(): Thread;
    block(reason: string): Thread;
    unblock(): Thread;
    submitForReview(): Thread;
    awaitInfo(): Thread;
    provideInfo(returnTo: "PENDING_REVIEW" | "ACTIVE"): Thread;
    review(approved: boolean): Thread;
    close(userId: string, note?: string): Thread;
    canBeModified(): boolean;
    equals(other: Thread | null | undefined): boolean;
    get id(): string;
    get companyId(): string;
    get title(): string;
    get description(): string | undefined;
    get status(): ThreadStatus;
    get environment(): ThreadEnvironment;
    get period(): string | undefined;
    get priority(): ThreadPriority;
    get tags(): readonly string[];
    get tasks(): readonly ThreadTaskProps[];
    get agentAssignments(): readonly ThreadAgentAssignmentProps[];
    get evidenceIds(): readonly string[];
    get createdById(): string;
    get createdAt(): Date;
    get updatedAt(): Date;
    get closedAt(): Date | undefined;
    get closedById(): string | undefined;
    get closeNote(): string | undefined;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=thread.entity.d.ts.map