/**
 * Agent Context Value Object
 * Encapsulates agent metadata (name, version)
 * @example
 * ```ts
 * const value: AgentContextProps = {} as AgentContextProps;
 * console.log(value);
 * ```
 */

export interface AgentContextProps {
	name: string;
	version?: string;
}

/**
 * AgentContext class.
 *
 * @example
 * ```ts
 * const value = new AgentContext();
 * console.log(value);
 * ```
 */
export class AgentContext {
	readonly name: string;
	readonly version: string | null;

	private constructor(props: AgentContextProps) {
		this.name = props.name;
		this.version = props.version ?? null;
	}

	static create(props: AgentContextProps): AgentContext {
		if (!props.name || props.name.length === 0) {
			throw new Error("Agent name is required");
		}

		return new AgentContext(props);
	}

	equals(other: AgentContext): boolean {
		return this.name === other.name && this.version === other.version;
	}
}
