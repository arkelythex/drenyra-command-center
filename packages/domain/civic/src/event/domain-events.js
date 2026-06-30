import { DomainEvent } from "@arkelythex/domain";
export class ActValidatedEvent extends DomainEvent {
    aggregateId;
    actId;
    validatorId;
    result;
    constructor(aggregateId, actId, validatorId, result) {
        super();
        this.aggregateId = aggregateId;
        this.actId = actId;
        this.validatorId = validatorId;
        this.result = result;
    }
    get eventName() {
        return "civic.act.validated";
    }
    getPayload() {
        return {
            aggregateId: this.aggregateId,
            aggregateType: "ElectoralAct",
            actId: this.actId,
            validatorId: this.validatorId,
            result: this.result,
        };
    }
}
export class FraudDetectedEvent extends DomainEvent {
    aggregateId;
    electionId;
    actId;
    indicator;
    severity;
    constructor(aggregateId, electionId, actId, indicator, severity) {
        super();
        this.aggregateId = aggregateId;
        this.electionId = electionId;
        this.actId = actId;
        this.indicator = indicator;
        this.severity = severity;
    }
    get eventName() {
        return "civic.fraud.detected";
    }
    getPayload() {
        return {
            aggregateId: this.aggregateId,
            aggregateType: "Election",
            electionId: this.electionId,
            actId: this.actId,
            indicator: this.indicator.toJSON(),
            severity: this.severity,
        };
    }
}
export class AuditCompletedEvent extends DomainEvent {
    aggregateId;
    actId;
    auditId;
    findings;
    constructor(aggregateId, actId, auditId, findings) {
        super();
        this.aggregateId = aggregateId;
        this.actId = actId;
        this.auditId = auditId;
        this.findings = findings;
    }
    get eventName() {
        return "civic.audit.completed";
    }
    getPayload() {
        return {
            aggregateId: this.aggregateId,
            aggregateType: "AuditTrail",
            actId: this.actId,
            auditId: this.auditId,
            findings: [...this.findings],
        };
    }
}
export class CaseEscalatedEvent extends DomainEvent {
    aggregateId;
    caseId;
    reason;
    escalatedTo;
    constructor(aggregateId, caseId, reason, escalatedTo) {
        super();
        this.aggregateId = aggregateId;
        this.caseId = caseId;
        this.reason = reason;
        this.escalatedTo = escalatedTo;
    }
    get eventName() {
        return "civic.case.escalated";
    }
    getPayload() {
        return {
            aggregateId: this.aggregateId,
            aggregateType: "CivicCase",
            caseId: this.caseId,
            reason: this.reason,
            escalatedTo: this.escalatedTo,
        };
    }
}
//# sourceMappingURL=domain-events.js.map