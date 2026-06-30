export class VoteTally {
    props;
    constructor(props) {
        this.props = props;
        Object.freeze(this);
    }
    static create(props) {
        return new VoteTally({
            ...props,
            anomalies: props.anomalies ?? [],
        });
    }
    get candidateId() {
        return this.props.candidateId;
    }
    get candidateName() {
        return this.props.candidateName;
    }
    get party() {
        return this.props.party;
    }
    get voteCount() {
        return this.props.voteCount;
    }
    get isValid() {
        return this.props.isValid;
    }
    get anomalies() {
        return this.props.anomalies ?? [];
    }
    equals(other) {
        if (!other)
            return false;
        return this.props.candidateId === other.props.candidateId;
    }
    toJSON() {
        return { ...this.props };
    }
}
//# sourceMappingURL=VoteTally.js.map