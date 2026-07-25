/**
 * Hash Chain Value Object
 * Encapsulates hash + prevHash for immutability
 * @example
 * ```ts
 * const value: HashChainProps = {} as HashChainProps;
 * console.log(value);
 * ```
 */

export interface HashChainProps {
	hash: string;
	prevHash: string | null;
}

/**
 * HashChain class.
 *
 * @example
 * ```ts
 * const value = new HashChain();
 * console.log(value);
 * ```
 */
export class HashChain {
	readonly hash: string;
	readonly prevHash: string | null;

	private constructor(props: HashChainProps) {
		this.hash = props.hash;
		this.prevHash = props.prevHash;
	}

	static create(props: HashChainProps): HashChain {
		if (props.hash?.length !== 64) {
			throw new Error("Hash must be 64-character hex string");
		}

		return new HashChain(props);
	}

	static genesis(hash: string): HashChain {
		return HashChain.create({ hash, prevHash: null });
	}

	isGenesis(): boolean {
		return this.prevHash === null;
	}

	equals(other: HashChain): boolean {
		return this.hash === other.hash && this.prevHash === other.prevHash;
	}
}
