export var FraudIndicatorType;
(function (FraudIndicatorType) {
    FraudIndicatorType["VOTE_PATTERN_ANOMALY"] = "VOTE_PATTERN_ANOMALY";
    FraudIndicatorType["TURNOUT_SPIKE"] = "TURNOUT_SPIKE";
    FraudIndicatorType["ACT_TAMPERING"] = "ACT_TAMPERING";
    FraudIndicatorType["TIMESTAMP_IRREGULARITY"] = "TIMESTAMP_IRREGULARITY";
    FraudIndicatorType["DUPLICATE_VOTER"] = "DUPLICATE_VOTER";
})(FraudIndicatorType || (FraudIndicatorType = {}));
export var FraudSeverity;
(function (FraudSeverity) {
    FraudSeverity["LOW"] = "LOW";
    FraudSeverity["MEDIUM"] = "MEDIUM";
    FraudSeverity["HIGH"] = "HIGH";
    FraudSeverity["CRITICAL"] = "CRITICAL";
})(FraudSeverity || (FraudSeverity = {}));
export class FraudIndicator {
    props;
    constructor(props) {
        this.props = props;
        Object.freeze(this);
    }
    static create(props) {
        return new FraudIndicator({ ...props });
    }
    get type() {
        return this.props.type;
    }
    get severity() {
        return this.props.severity;
    }
    get description() {
        return this.props.description;
    }
    get evidence() {
        return this.props.evidence;
    }
    get detectedAt() {
        return this.props.detectedAt;
    }
    equals(other) {
        if (!other)
            return false;
        return (this.props.type === other.props.type &&
            this.props.severity === other.props.severity &&
            this.props.description === other.props.description &&
            this.props.detectedAt.getTime() === other.props.detectedAt.getTime());
    }
    toJSON() {
        return {
            type: this.props.type,
            severity: this.props.severity,
            description: this.props.description,
            evidence: [...this.props.evidence],
            detectedAt: this.props.detectedAt.toISOString(),
        };
    }
}
//# sourceMappingURL=FraudIndicator.js.map