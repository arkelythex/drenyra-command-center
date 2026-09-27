import { assertValidAccountingPrProps, assertValidTransition, } from "./accounting-pr.validators";
export class AccountingPr {
    props;
    constructor(props) {
        this.props = props;
        assertValidAccountingPrProps(props);
        Object.freeze(this);
    }
    static create(props) {
        return new AccountingPr(props);
    }
    static fromPrimitives(data) {
        return new AccountingPr({
            id: data.id,
            companyId: data.companyId,
            prNumber: data.prNumber,
            title: data.title,
            description: data.description,
            status: (data.status ?? "DRAFT"),
            entries: (data.entries ?? []),
            evidenceIds: (data.evidenceIds ?? []),
            totalDebitCents: data.totalDebitCents ?? 0,
            totalCreditCents: data.totalCreditCents ?? 0,
            reviewerId: data.reviewerId,
            reviewedAt: data.reviewedAt
                ? new Date(data.reviewedAt)
                : undefined,
            reviewComment: data.reviewComment,
            approveSignerIds: (data.approveSignerIds ?? []),
            approveSignatures: (data.approveSignatures ?? []),
            createdById: data.createdById,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
        });
    }
    submitForReview(reviewerId) {
        assertValidTransition(this.props.status, "PENDING_REVIEW");
        return new AccountingPr({
            ...this.props,
            status: "PENDING_REVIEW",
            reviewerId: reviewerId ?? this.props.reviewerId,
            updatedAt: new Date(),
        });
    }
    approve(signerId, comment) {
        assertValidTransition(this.props.status, "APPROVED");
        const signature = {
            signerId,
            signedAt: new Date().toISOString(),
            comment,
        };
        return new AccountingPr({
            ...this.props,
            status: "APPROVED",
            reviewedAt: new Date(),
            reviewComment: comment ?? this.props.reviewComment,
            approveSignerIds: [
                ...new Set([...this.props.approveSignerIds, signerId]),
            ],
            approveSignatures: [...this.props.approveSignatures, signature],
            updatedAt: new Date(),
        });
    }
    reject(reason) {
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
    post() {
        assertValidTransition(this.props.status, "POSTED");
        return new AccountingPr({
            ...this.props,
            status: "POSTED",
            updatedAt: new Date(),
        });
    }
    addSignature(signerId, comment) {
        if (this.props.status !== "PENDING_REVIEW") {
            throw new Error("Solo se pueden agregar firmas a PRs en revisión");
        }
        const signature = {
            signerId,
            signedAt: new Date().toISOString(),
            comment,
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
    canBeModified() {
        return this.props.status === "DRAFT";
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
    get prNumber() {
        return this.props.prNumber;
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
    get entries() {
        return this.props.entries;
    }
    get evidenceIds() {
        return this.props.evidenceIds;
    }
    get totalDebitCents() {
        return this.props.totalDebitCents;
    }
    get totalCreditCents() {
        return this.props.totalCreditCents;
    }
    get reviewerId() {
        return this.props.reviewerId;
    }
    get reviewedAt() {
        return this.props.reviewedAt;
    }
    get reviewComment() {
        return this.props.reviewComment;
    }
    get approveSignerIds() {
        return this.props.approveSignerIds;
    }
    get approveSignatures() {
        return this.props.approveSignatures;
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
    toJSON() {
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
//# sourceMappingURL=accounting-pr.entity.js.map