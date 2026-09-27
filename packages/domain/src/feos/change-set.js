import { FeosError, generateId, nowTimestamp } from "./types";
export const CHANGE_SET_STATUS = {
    DRAFT: "draft",
    PROPOSED: "proposed",
    UNDER_REVIEW: "under_review",
    APPROVED: "approved",
    APPLIED: "applied",
    REJECTED: "rejected",
    ROLLED_BACK: "rolled_back",
    CANCELLED: "cancelled",
};
export class ChangeSet {
    props;
    constructor(props) {
        this.props = props;
        Object.freeze(this);
    }
    static create(input) {
        return new ChangeSet({
            id: generateId(),
            title: input.title,
            description: input.description,
            workspaceId: input.workspaceId,
            status: "draft",
            entries: input.entries ?? [],
            parentId: input.parentId,
            childIds: [],
            scope: input.scope,
            createdBy: input.createdBy,
            traceId: input.traceId,
            createdAt: nowTimestamp(),
            updatedAt: nowTimestamp(),
            tags: input.tags,
            metadata: input.metadata,
        });
    }
    static fromProps(props) {
        return new ChangeSet(props);
    }
    get id() { return this.props.id; }
    get title() { return this.props.title; }
    get status() { return this.props.status; }
    get entries() { return this.props.entries; }
    get parentId() { return this.props.parentId; }
    get childIds() { return this.props.childIds; }
    transition(to) {
        if (!isValidCSTransition(this.props.status, to)) {
            throw new FeosError("INVALID_CHANGESET_TRANSITION", `Cannot transition from "${this.props.status}" to "${to}"`);
        }
        const now = nowTimestamp();
        return new ChangeSet({
            ...this.props,
            status: to,
            updatedAt: now,
            appliedAt: to === "applied" ? now : this.props.appliedAt,
            rolledBackAt: to === "rolled_back" ? now : this.props.rolledBackAt,
        });
    }
    propose() { return this.transition("proposed"); }
    submitForReview() { return this.transition("under_review"); }
    approve() { return this.transition("approved"); }
    reject() { return this.transition("rejected"); }
    apply() { return this.transition("applied"); }
    rollback() { return this.transition("rolled_back"); }
    cancel() { return this.transition("cancelled"); }
    addEntry(entry) {
        return new ChangeSet({ ...this.props, entries: [...this.props.entries, entry], updatedAt: nowTimestamp() });
    }
    fork(title, description, actor) {
        const child = new ChangeSet({
            ...this.props,
            id: generateId(),
            title,
            description,
            status: "draft",
            parentId: this.props.id,
            childIds: [],
            createdBy: actor,
            createdAt: nowTimestamp(),
            updatedAt: nowTimestamp(),
            entries: [...this.props.entries],
        });
        this.props.childIds.push(child.id);
        return child;
    }
    merge(child) {
        if (child.parentId !== this.props.id) {
            throw new FeosError("NOT_A_CHILD", `ChangeSet "${child.id}" is not a child of "${this.props.id}"`);
        }
        if (child.status !== "approved") {
            throw new FeosError("CHILD_NOT_APPROVED", `Child ChangeSet "${child.id}" must be approved before merge`);
        }
        return new ChangeSet({
            ...this.props,
            entries: [...this.props.entries, ...child.entries],
            updatedAt: nowTimestamp(),
        });
    }
    linkEvidence(evidenceRootId) {
        return new ChangeSet({ ...this.props, evidenceRootId, updatedAt: nowTimestamp() });
    }
    toProps() {
        return { ...this.props };
    }
}
const CS_TRANSITIONS = {
    draft: ["proposed", "cancelled"],
    proposed: ["under_review", "cancelled"],
    under_review: ["approved", "rejected", "cancelled"],
    approved: ["applied", "cancelled"],
    applied: ["rolled_back"],
    rejected: [],
    rolled_back: [],
    cancelled: [],
};
export function isValidCSTransition(from, to) {
    return CS_TRANSITIONS[from]?.includes(to) ?? false;
}
//# sourceMappingURL=change-set.js.map