export class AccountingDiff {
    id;
    threadId;
    type;
    title;
    description;
    changes;
    impact;
    status;
    createdBy;
    evidenceIds;
    createdAt;
    updatedAt;
    reviewerId;
    rejectionReason;
    pendingQuestion;
    constructor(id, threadId, type, title, description, changes, impact, status, createdBy, evidenceIds, createdAt, updatedAt, reviewerId, rejectionReason, pendingQuestion) {
        this.id = id;
        this.threadId = threadId;
        this.type = type;
        this.title = title;
        this.description = description;
        this.changes = changes;
        this.impact = impact;
        this.status = status;
        this.createdBy = createdBy;
        this.evidenceIds = evidenceIds;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.reviewerId = reviewerId;
        this.rejectionReason = rejectionReason;
        this.pendingQuestion = pendingQuestion;
    }
    static create(props) {
        return new AccountingDiff(props.id, props.threadId, props.type, props.title, props.description, props.changes, props.impact, "pending", props.createdBy, props.evidenceIds, new Date(), new Date(), undefined, undefined, undefined);
    }
    approve(reviewerId) {
        this.assertStatus("pending");
        return new AccountingDiff(this.id, this.threadId, this.type, this.title, this.description, this.changes, this.impact, "approved", this.createdBy, this.evidenceIds, this.createdAt, new Date(), reviewerId);
    }
    reject(reviewerId, reason) {
        this.assertStatus("pending");
        return new AccountingDiff(this.id, this.threadId, this.type, this.title, this.description, this.changes, this.impact, "rejected", this.createdBy, this.evidenceIds, this.createdAt, new Date(), reviewerId, reason);
    }
    requestInfo(question) {
        this.assertStatus("pending");
        return new AccountingDiff(this.id, this.threadId, this.type, this.title, this.description, this.changes, this.impact, "info_requested", this.createdBy, this.evidenceIds, this.createdAt, new Date(), undefined, undefined, question);
    }
    canTransitionTo(target) {
        const allowed = {
            pending: ["approved", "rejected", "info_requested"],
            approved: [],
            rejected: [],
            info_requested: ["approved", "rejected"],
        };
        return allowed[this.status].includes(target);
    }
    assertStatus(expected) {
        if (this.status !== expected) {
            throw new Error(`Invalid transition: cannot modify diff in status "${this.status}"`);
        }
    }
    toJSON() {
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
//# sourceMappingURL=accounting-diff.js.map