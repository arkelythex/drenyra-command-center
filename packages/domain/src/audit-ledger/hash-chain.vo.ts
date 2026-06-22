/**
 * HashChain Value Object
 *
 * Encapsulates a SHA-256 hash and its predecessor hash for building
 * an immutable chain of fiscal events. A genesis entry has prevHash === null.
 *
 * @example
 * ```ts
 * const genesis = HashChain.genesis("a".repeat(64));
 * const linked   = HashChain.create({ hash: "b".repeat(64), prevHash: genesis.hash });
 * ```
 */
export interface HashChainProps {
	hash: string;
	prevHash: string | null;
}

export class HashChain {
	readonly hash: string;
	readonly prevHash: string | null;

	private constructor(props: HashChainProps) {
		this.hash = props.hash;
		this.prevHash = props.prevHash;
	}

	/**
	 * Factory — validates hash is a 64-char lowercase hex string.
	 * @throws {Error} if hash is not valid SHA-256 hex.
	 */
	static create(props: HashChainProps): HashChain {
		if (!isValidSha256(props.hash)) {
			throw new Error(
				`Hash must be a 64-character lowercase hex string, got "${props.hash}"`,
			);
		}
		return new HashChain(props);
	}

	/** Shortcut to create a genesis (first) entry. */
	static genesis(hash: string): HashChain {
		return HashChain.create({ hash, prevHash: null });
	}

	/** True when this is the first entry in the chain. */
	isGenesis(): boolean {
		return this.prevHash === null;
	}

	/** Structural equality — same hash AND same prevHash. */
	equals(other: HashChain): boolean {
		return this.hash === other.hash && this.prevHash === other.prevHash;
	}
}

/**
 * Returns true when `s` is a 64-char lowercase hex string.
 *
 * @internal
 */
export function isValidSha256(s: string): boolean {
	return /^[0-9a-f]{64}$/.test(s);
}
