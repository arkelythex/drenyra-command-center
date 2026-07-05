/**
 * Result of an AI classification for accounting/tax mapping.
 *
 * @example
 * ```ts
 * const value: AIClassification = {} as AIClassification;
 * console.log(value);
 * ```
 */
export interface AIClassification {
	accountCode: string;
	accountName: string;
	subAccountCode?: string;
	taxType: "GRAVADO" | "EXONERADO" | "INAFECTO";
	confidence: number;
	reasoning: string;
}

/**
 * AI provider port used by application/infrastructure layers.
 *
 * @example
 * ```ts
 * const value: IAIProvider = {} as IAIProvider;
 * console.log(value);
 * ```
 */
export interface IAIProvider {
	classify(description: string, context?: string): Promise<AIClassification>;
	analyze(
		message: string,
		images?: string[],
		context?: string,
	): Promise<string>;
	embedText?(text: string): Promise<number[]>;
}
