export class HashChain {
    hash;
    prevHash;
    constructor(props) {
        this.hash = props.hash;
        this.prevHash = props.prevHash;
    }
    static create(props) {
        if (!isValidSha256(props.hash)) {
            throw new Error(`Hash must be a 64-character lowercase hex string, got "${props.hash}"`);
        }
        return new HashChain(props);
    }
    static genesis(hash) {
        return HashChain.create({ hash, prevHash: null });
    }
    isGenesis() {
        return this.prevHash === null;
    }
    equals(other) {
        return this.hash === other.hash && this.prevHash === other.prevHash;
    }
}
export function isValidSha256(s) {
    return /^[0-9a-f]{64}$/.test(s);
}
//# sourceMappingURL=hash-chain.vo.js.map