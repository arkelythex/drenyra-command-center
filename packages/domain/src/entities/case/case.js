import { DomainEvent } from "../../events";
export function CaseId(id) {
    if (!id || id.length === 0) {
        throw new Error("CaseId cannot be empty");
    }
    return id;
}
export class Case {
    id;
    companyId;
    status;
    createdAt;
    updatedAt;
    projections;
    constructor(id, companyId, status, projections, createdAt, updatedAt) {
        this.id = id;
        this.companyId = companyId;
        this.status = status;
        this.projections = projections;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    static create(params) {
        return new Case(CaseId(crypto.randomUUID()), params.companyId, "open", new Map(), new Date(), new Date());
    }
    getProjection(domain) {
        return this.projections.get(domain);
    }
    attachProjection(domain, projection, owner) {
        if (domain !== owner) {
            throw new Error(`Domain "${domain}" cannot modify projection owned by "${owner}"`);
        }
        const newProjections = new Map(this.projections);
        newProjections.set(domain, {
            ...projection,
            domain,
            updatedAt: new Date(),
        });
        return new Case(this.id, this.companyId, this.status, newProjections, this.createdAt, new Date());
    }
    getAllProjections() {
        return new Map(this.projections);
    }
    getAttachedDomains() {
        return Array.from(this.projections.keys());
    }
    activate() {
        if (this.status !== "open") {
            throw new Error(`Cannot activate case in status "${this.status}"`);
        }
        return new Case(this.id, this.companyId, "active", this.projections, this.createdAt, new Date());
    }
    resolve() {
        if (this.status !== "active") {
            throw new Error(`Cannot resolve case in status "${this.status}"`);
        }
        return new Case(this.id, this.companyId, "resolved", this.projections, this.createdAt, new Date());
    }
    close() {
        if (this.status !== "resolved") {
            throw new Error(`Cannot close case in status "${this.status}"`);
        }
        return new Case(this.id, this.companyId, "closed", this.projections, this.createdAt, new Date());
    }
    static projectionAttached(caseId, domain) {
        return new CaseProjectionAttached(caseId, domain);
    }
}
export class CaseProjectionAttached extends DomainEvent {
    caseId;
    domain;
    get eventName() {
        return "case.projection.attached";
    }
    constructor(caseId, domain) {
        super();
        this.caseId = caseId;
        this.domain = domain;
    }
    getPayload() {
        return {
            caseId: this.caseId,
            domain: this.domain,
        };
    }
}
export class CaseProjectionUpdated extends DomainEvent {
    caseId;
    domain;
    changedFields;
    get eventName() {
        return "case.projection.updated";
    }
    constructor(caseId, domain, changedFields) {
        super();
        this.caseId = caseId;
        this.domain = domain;
        this.changedFields = changedFields;
    }
    getPayload() {
        return {
            caseId: this.caseId,
            domain: this.domain,
            changedFields: this.changedFields,
        };
    }
}
export class CaseCrossDomainQuery extends DomainEvent {
    caseId;
    sourceDomain;
    targetDomain;
    queryType;
    queryPayload;
    get eventName() {
        return "case.cross_domain.query";
    }
    constructor(caseId, sourceDomain, targetDomain, queryType, queryPayload) {
        super();
        this.caseId = caseId;
        this.sourceDomain = sourceDomain;
        this.targetDomain = targetDomain;
        this.queryType = queryType;
        this.queryPayload = queryPayload;
    }
    getPayload() {
        return {
            caseId: this.caseId,
            sourceDomain: this.sourceDomain,
            targetDomain: this.targetDomain,
            queryType: this.queryType,
            payload: this.queryPayload,
        };
    }
}
//# sourceMappingURL=case.js.map