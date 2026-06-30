export var AuditEvidenceType;
(function (AuditEvidenceType) {
    AuditEvidenceType["IMAGE"] = "IMAGE";
    AuditEvidenceType["DOCUMENT"] = "DOCUMENT";
    AuditEvidenceType["REPORT"] = "REPORT";
    AuditEvidenceType["DATA"] = "DATA";
})(AuditEvidenceType || (AuditEvidenceType = {}));
export class AuditEvidence {
    props;
    constructor(props) {
        this.props = props;
        Object.freeze(this);
    }
    static create(props) {
        return new AuditEvidence({ ...props });
    }
    get type() {
        return this.props.type;
    }
    get content() {
        return this.props.content;
    }
    get hash() {
        return this.props.hash;
    }
    get timestamp() {
        return this.props.timestamp;
    }
    equals(other) {
        if (!other)
            return false;
        return this.props.hash === other.props.hash;
    }
    toJSON() {
        return {
            type: this.props.type,
            content: this.props.content,
            hash: this.props.hash,
            timestamp: this.props.timestamp.toISOString(),
        };
    }
}
//# sourceMappingURL=AuditEvidence.js.map