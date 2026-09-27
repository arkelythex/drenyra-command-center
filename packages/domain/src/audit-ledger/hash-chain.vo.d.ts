export interface HashChainProps {
    hash: string;
    prevHash: string | null;
}
export declare class HashChain {
    readonly hash: string;
    readonly prevHash: string | null;
    private constructor();
    static create(props: HashChainProps): HashChain;
    static genesis(hash: string): HashChain;
    isGenesis(): boolean;
    equals(other: HashChain): boolean;
}
export declare function isValidSha256(s: string): boolean;
//# sourceMappingURL=hash-chain.vo.d.ts.map