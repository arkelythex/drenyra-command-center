/**
 * PromptVersion Value Object
 *
 * Represents a semantic version for AI prompts (e.g., "1.2.3").
 * Immutable, comparable, and self-validating.
 *
 * @example
 * ```ts
 * const v = PromptVersion.parse("1.2.3");
 * v.incrementPatch().toString(); // "1.2.4"
 * ```
 */

export class PromptVersion {
	private constructor(
		private readonly major: number,
		private readonly minor: number,
		private readonly patch: number,
	) {
		Object.freeze(this);
	}

	/**
	 * Parse a version string into a PromptVersion.
	 * @throws Error if format is invalid
	 */
	static parse(version: string): PromptVersion {
		const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
		if (!match) {
			throw new Error(
				`Invalid version format: "${version}". Expected semver (e.g., "1.0.0")`,
			);
		}

		const [, majorStr, minorStr, patchStr] = match;
		const major = parseInt(majorStr!, 10);
		const minor = parseInt(minorStr!, 10);
		const patch = parseInt(patchStr!, 10);

		return new PromptVersion(major, minor, patch);
	}

	/**
	 * Create the initial version (1.0.0)
	 */
	static initial(): PromptVersion {
		return new PromptVersion(1, 0, 0);
	}

	/**
	 * Create a version from individual components
	 */
	static create(major: number, minor: number, patch: number): PromptVersion {
		if (major < 0 || minor < 0 || patch < 0) {
			throw new Error("Version components must be non-negative");
		}
		return new PromptVersion(major, minor, patch);
	}

	/**
	 * Increment patch version (bug fixes, minor prompt adjustments)
	 * 1.0.0 -> 1.0.1
	 */
	incrementPatch(): PromptVersion {
		return new PromptVersion(this.major, this.minor, this.patch + 1);
	}

	/**
	 * Increment minor version (new features, significant prompt changes)
	 * 1.0.5 -> 1.1.0
	 */
	incrementMinor(): PromptVersion {
		return new PromptVersion(this.major, this.minor + 1, 0);
	}

	/**
	 * Increment major version (breaking changes, complete prompt rewrite)
	 * 1.5.3 -> 2.0.0
	 */
	incrementMajor(): PromptVersion {
		return new PromptVersion(this.major + 1, 0, 0);
	}

	/**
	 * Check if this version is newer than another
	 */
	isNewerThan(other: PromptVersion): boolean {
		if (this.major !== other.major) {
			return this.major > other.major;
		}
		if (this.minor !== other.minor) {
			return this.minor > other.minor;
		}
		return this.patch > other.patch;
	}

	/**
	 * Check if this version is older than another
	 */
	isOlderThan(other: PromptVersion): boolean {
		return other.isNewerThan(this);
	}

	/**
	 * Check equality with another version
	 */
	equals(other: PromptVersion): boolean {
		return (
			this.major === other.major &&
			this.minor === other.minor &&
			this.patch === other.patch
		);
	}

	/**
	 * Compare two versions (for sorting)
	 * Returns: -1 if this < other, 0 if equal, 1 if this > other
	 */
	compareTo(other: PromptVersion): -1 | 0 | 1 {
		if (this.equals(other)) return 0;
		return this.isNewerThan(other) ? 1 : -1;
	}

	/**
	 * Get major version number
	 */
	getMajor(): number {
		return this.major;
	}

	/**
	 * Get minor version number
	 */
	getMinor(): number {
		return this.minor;
	}

	/**
	 * Get patch version number
	 */
	getPatch(): number {
		return this.patch;
	}

	/**
	 * Convert to string representation
	 */
	toString(): string {
		return `${this.major}.${this.minor}.${this.patch}`;
	}

	/**
	 * Convert to JSON-serializable format
	 */
	toJSON(): string {
		return this.toString();
	}
}
