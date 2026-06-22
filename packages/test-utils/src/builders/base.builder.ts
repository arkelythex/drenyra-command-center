/**
 * Base Builder class for fluent test data construction.
 *
 * Provides a generic Builder pattern implementation with fluent API
 * for creating complex test objects in a readable, composable way.
 *
 * @typeParam TProps - The props/data type used during construction
 * @typeParam TBuilt - The final built type (defaults to TProps)
 *
 * @example
 * ```ts
 * class TestBuilder extends BaseBuilder<TestData> {
 *   constructor() {
 *     super({ id: 'test', name: 'Default' });
 *   }
 *   withName(name: string) { return this.set({ name }); }
 * }
 *
 * const data = new TestBuilder().withName('Custom').build();
 * ```
 */
export abstract class BaseBuilder<TProps, TBuilt = TProps> {
	protected data: Partial<TProps>;

	constructor(defaults: Partial<TProps>) {
		this.data = { ...defaults };
	}

	/**
	 * Override specific fields of the test data.
	 */
	protected set(fields: Partial<TProps>): this {
		this.data = { ...this.data, ...fields };
		return this;
	}

	/**
	 * Build the final test object.
	 * Subclasses must implement this to return a fully typed object.
	 */
	abstract build(): TBuilt;
}
