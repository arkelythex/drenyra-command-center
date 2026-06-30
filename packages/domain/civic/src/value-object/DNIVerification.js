export var DNIVerificationStatus;
(function (DNIVerificationStatus) {
    DNIVerificationStatus["PENDING"] = "PENDING";
    DNIVerificationStatus["VERIFIED"] = "VERIFIED";
    DNIVerificationStatus["UNVERIFIED"] = "UNVERIFIED";
    DNIVerificationStatus["NOT_FOUND"] = "NOT_FOUND";
})(DNIVerificationStatus || (DNIVerificationStatus = {}));
export class DNIVerification {
    props;
    constructor(props) {
        this.props = props;
        Object.freeze(this);
    }
    static create(dni) {
        return new DNIVerification({
            dni,
            verificationStatus: DNIVerificationStatus.PENDING,
        });
    }
    static verified(dni, verifierId) {
        return new DNIVerification({
            dni,
            verificationStatus: DNIVerificationStatus.VERIFIED,
            verifiedAt: new Date(),
            verifierId,
        });
    }
    static notFound(dni) {
        return new DNIVerification({
            dni,
            verificationStatus: DNIVerificationStatus.NOT_FOUND,
        });
    }
    static validateChecksum(dniValue) {
        if (!/^\d{8}$/.test(dniValue)) {
            return false;
        }
        const sum = dniValue
            .split("")
            .reduce((acc, digit, index) => acc + parseInt(digit, 10) * (8 - index), 0);
        return sum % 11 !== 0;
    }
    get dni() {
        return this.props.dni;
    }
    get verificationStatus() {
        return this.props.verificationStatus;
    }
    get verifiedAt() {
        return this.props.verifiedAt;
    }
    get verifierId() {
        return this.props.verifierId;
    }
    markVerified(verifierId) {
        return new DNIVerification({
            dni: this.props.dni,
            verificationStatus: DNIVerificationStatus.VERIFIED,
            verifiedAt: new Date(),
            verifierId,
        });
    }
    markUnverified() {
        return new DNIVerification({
            dni: this.props.dni,
            verificationStatus: DNIVerificationStatus.UNVERIFIED,
        });
    }
    equals(other) {
        if (!other)
            return false;
        return (this.props.dni.equals(other.props.dni) &&
            this.props.verificationStatus === other.props.verificationStatus);
    }
    toJSON() {
        const json = {
            dni: this.props.dni.toJSON(),
            verificationStatus: this.props.verificationStatus,
        };
        if (this.props.verifiedAt) {
            json.verifiedAt = this.props.verifiedAt.toISOString();
        }
        if (this.props.verifierId) {
            json.verifierId = this.props.verifierId;
        }
        return json;
    }
}
//# sourceMappingURL=DNIVerification.js.map