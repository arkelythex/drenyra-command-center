import { assertThreadCanActivate, assertThreadCanSubmitForReview, assertValidDate, assertValidThreadProps, assertValidTransition, } from "./thread.validators";
export class Thread {
    props;
    constructor(props) {
        this.props = props;
        assertValidThreadProps(props);
        Object.freeze(this);
    }
    static create(props) {
        return new Thread(props);
    }
    static fromPrimitives(data) {
        return new Thread({
            id: data.id,
            companyId: data.companyId,
            title: data.title,
            description: data.description,
            status: (data.status ?? "DRAFT"),
            environment: (data.environment ?? "local"),
            period: data.period,
            priority: (data.priority ?? "MEDIUM"),
            tags: (data.tags ?? []),
            tasks: (data.tasks ?? []),
            agentAssignments: (data.agentAssignments ??
                []),
            evidenceIds: (data.evidenceIds ?? []),
            createdById: data.createdById,
            createdAt: assertValidDate(data.createdAt, "createdAt"),
            updatedAt: assertValidDate(data.updatedAt, "updatedAt"),
            closedAt: data.closedAt
                ? assertValidDate(data.closedAt, "closedAt")
                : undefined,
            closedById: data.closedById,
            closeNote: data.closeNote,
        });
    }
    activate() {
        assertValidTransition(this.props.status, "ACTIVE");
        assertThreadCanActivate(this.props.tasks);
        return new Thread({
            ...this.props,
            status: "ACTIVE",
            updatedAt: new Date(),
        });
    }
    block(reason) {
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
    unblock() {
        assertValidTransition(this.props.status, "ACTIVE");
        return new Thread({
            ...this.props,
            status: "ACTIVE",
            updatedAt: new Date(),
        });
    }
    submitForReview() {
        assertValidTransition(this.props.status, "PENDING_REVIEW");
        assertThreadCanSubmitForReview(this.props.tasks);
        return new Thread({
            ...this.props,
            status: "PENDING_REVIEW",
            updatedAt: new Date(),
        });
    }
    awaitInfo() {
        assertValidTransition(this.props.status, "AWAITING_INFO");
        return new Thread({
            ...this.props,
            status: "AWAITING_INFO",
            updatedAt: new Date(),
        });
    }
    provideInfo(returnTo) {
        assertValidTransition(this.props.status, returnTo);
        return new Thread({
            ...this.props,
            status: returnTo,
            updatedAt: new Date(),
        });
    }
    review(approved) {
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
    close(userId, note) {
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
    canBeModified() {
        return this.props.status !== "CLOSED";
    }
    equals(other) {
        if (!other)
            return false;
        return this.props.id === other.props.id;
    }
    get id() {
        return this.props.id;
    }
    get companyId() {
        return this.props.companyId;
    }
    get title() {
        return this.props.title;
    }
    get description() {
        return this.props.description;
    }
    get status() {
        return this.props.status;
    }
    get environment() {
        return this.props.environment;
    }
    get period() {
        return this.props.period;
    }
    get priority() {
        return this.props.priority;
    }
    get tags() {
        return this.props.tags;
    }
    get tasks() {
        return this.props.tasks;
    }
    get agentAssignments() {
        return this.props.agentAssignments;
    }
    get evidenceIds() {
        return this.props.evidenceIds;
    }
    get createdById() {
        return this.props.createdById;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    get closedAt() {
        return this.props.closedAt;
    }
    get closedById() {
        return this.props.closedById;
    }
    get closeNote() {
        return this.props.closeNote;
    }
    toJSON() {
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
//# sourceMappingURL=thread.entity.js.map