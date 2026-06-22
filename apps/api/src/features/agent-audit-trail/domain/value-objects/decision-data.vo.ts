/**
 * Decision Data Value Object
 * Encapsulates decision type, inputs, outputs, reasoning
 * @example
 * ```ts
 * const value: DecisionDataProps = {} as DecisionDataProps;
 * console.log(value);
 * ```
 */

export interface DecisionDataProps {
	type: string;
	inputs: Record<string, unknown>;
	outputs: Record<string, unknown>;
	reasoning?: string;
}

/**
 * DecisionData class.
 *
 * @example
 * ```ts
 * const value = new DecisionData();
 * console.log(value);
 * ```
 */
export class DecisionData {
	readonly type: string;
	readonly inputs: Record<string, unknown>;
	readonly outputs: Record<string, unknown>;
	readonly reasoning: string | null;

	private constructor(props: DecisionDataProps) {
		this.type = props.type;
		this.inputs = props.inputs;
		this.outputs = props.outputs;
		this.reasoning = props.reasoning ?? null;
	}

	static create(props: DecisionDataProps): DecisionData {
		if (!props.type || props.type.length === 0) {
			throw new Error("Decision type is required");
		}

		if (!props.inputs || Object.keys(props.inputs).length === 0) {
			throw new Error("Inputs must contain at least one field");
		}

		if (!props.outputs || Object.keys(props.outputs).length === 0) {
			throw new Error("Outputs must contain at least one field");
		}

		return new DecisionData(props);
	}

	equals(other: DecisionData): boolean {
		return (
			this.type === other.type &&
			JSON.stringify(this.inputs) === JSON.stringify(other.inputs) &&
			JSON.stringify(this.outputs) === JSON.stringify(other.outputs)
		);
	}
}
