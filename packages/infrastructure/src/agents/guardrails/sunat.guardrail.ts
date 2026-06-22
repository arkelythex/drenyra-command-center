/**
 * SUNAT Guardrail
 *
 * Validates data before SUNAT submission to prevent errors and rejections.
 * Implements OpenAI Guardrails pattern for runtime validation.
 *
 * @since December 2025 - AI-First Architecture
 * @example
 * ```ts
 * const value: GuardrailResult = {} as GuardrailResult;
 * console.log(value);
 * ```
 */

export interface GuardrailResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
	requiresHumanApproval: boolean;
}

/**
 * SUNATSubmissionData interface.
 *
 * @example
 * ```ts
 * const value: SUNATSubmissionData = {} as SUNATSubmissionData;
 * console.log(value);
 * ```
 */
export interface SUNATSubmissionData {
	ruc: string;
	documentType: "factura" | "boleta" | "nota_credito" | "nota_debito";
	series: string;
	number: string;
	amount: number;
	igv: number;
	total: number;
	issueDate: Date;
	clientRUC?: string;
	items: Array<{
		description: string;
		quantity: number;
		unitPrice: number;
		total: number;
	}>;
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate RUC using Modulo 11 algorithm
 * @param ruc - Input for ruc.
 * @returns Result of validateRUCModulo11.
 * @example
 * ```ts
 * const result = validateRUCModulo11("");
 * console.log(result);
 * ```
 */

export function validateRUCModulo11(ruc: string): boolean {
	if (!/^\d{11}$/.test(ruc)) return false;

	const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
	const digits = ruc.split("").map(Number);

	let sum = 0;
	for (let i = 0; i < 10; i++) {
		sum += (digits[i] ?? 0) * (weights[i] ?? 0);
	}

	const remainder = sum % 11;
	const checkDigit = 11 - remainder;
	const expectedCheck =
		checkDigit === 10 ? 0 : checkDigit === 11 ? 1 : checkDigit;

	return digits[10] === expectedCheck;
}

/**
 * Validate IGV calculation (18% tolerance)
 * @param data - Input for data.
 * @returns Result of validateIGVCalculation.
 * @example
 * ```ts
 * const result = validateIGVCalculation({} as SUNATSubmissionData);
 * console.log(result);
 * ```
 */

export function validateIGVCalculation(data: SUNATSubmissionData): boolean {
	const expectedIGV = data.amount * 0.18;
	const tolerance = 0.01; // 1 cent tolerance
	return Math.abs(data.igv - expectedIGV) <= tolerance;
}

/**
 * Validate total calculation
 * @param data - Input for data.
 * @returns Result of validateTotalCalculation.
 * @example
 * ```ts
 * const result = validateTotalCalculation({} as SUNATSubmissionData);
 * console.log(result);
 * ```
 */

export function validateTotalCalculation(data: SUNATSubmissionData): boolean {
	const expectedTotal = data.amount + data.igv;
	const tolerance = 0.01;
	return Math.abs(data.total - expectedTotal) <= tolerance;
}

/**
 * Validate document series format
 * @param series - Input for series.
 * @param documentType - Input for documentType.
 * @returns Result of validateSeriesFormat.
 * @example
 * ```ts
 * const result = validateSeriesFormat("", "");
 * console.log(result);
 * ```
 */

export function validateSeriesFormat(
	series: string,
	documentType: string,
): boolean {
	const patterns: Record<string, RegExp> = {
		factura: /^F\d{3}$/,
		boleta: /^B\d{3}$/,
		nota_credito: /^(FC|BC)\d{2}$/,
		nota_debito: /^(FD|BD)\d{2}$/,
	};
	return patterns[documentType]?.test(series) ?? false;
}

/**
 * Validate document number format
 * @param number - Input for number.
 * @returns Result of validateDocumentNumber.
 * @example
 * ```ts
 * const result = validateDocumentNumber("");
 * console.log(result);
 * ```
 */

export function validateDocumentNumber(number: string): boolean {
	return /^\d{1,8}$/.test(number);
}

// ============================================
// GUARDRAIL IMPLEMENTATION
// ============================================

/**
 * SUNAT Submission Guardrail
 *
 * Validates all data before sending to SUNAT to prevent rejections.
 * Returns detailed errors and warnings for correction.
 * @example
 * ```ts
 * console.log(sunatGuardrail);
 * ```
 */

export const sunatGuardrail = {
	name: "sunat_submission_check",

	/**
	 * Validate SUNAT submission data
	 */
	async validate(input: SUNATSubmissionData): Promise<GuardrailResult> {
		const errors: string[] = [];
		const warnings: string[] = [];

		// 1. Validate issuer RUC
		if (!validateRUCModulo11(input.ruc)) {
			errors.push(`RUC del emisor inválido: ${input.ruc}`);
		}

		// 2. Validate client RUC (for facturas)
		if (input.documentType === "factura" && input.clientRUC) {
			if (!validateRUCModulo11(input.clientRUC)) {
				errors.push(`RUC del cliente inválido: ${input.clientRUC}`);
			}
		}

		// 3. Validate IGV calculation
		if (!validateIGVCalculation(input)) {
			const expectedIGV = Math.round(input.amount * 0.18 * 100) / 100;
			errors.push(
				`Cálculo de IGV incorrecto. Esperado: S/ ${expectedIGV}, Recibido: S/ ${input.igv}`,
			);
		}

		// 4. Validate total calculation
		if (!validateTotalCalculation(input)) {
			const expectedTotal = Math.round((input.amount + input.igv) * 100) / 100;
			errors.push(
				`Cálculo de total incorrecto. Esperado: S/ ${expectedTotal}, Recibido: S/ ${input.total}`,
			);
		}

		// 5. Validate series format
		if (!validateSeriesFormat(input.series, input.documentType)) {
			errors.push(
				`Formato de serie inválido para ${input.documentType}: ${input.series}`,
			);
		}

		// 6. Validate document number
		if (!validateDocumentNumber(input.number)) {
			errors.push(`Número de documento inválido: ${input.number}`);
		}

		// 7. Validate issue date (not in future)
		if (input.issueDate > new Date()) {
			errors.push("La fecha de emisión no puede ser futura");
		}

		// 8. Validate items
		if (input.items.length === 0) {
			errors.push("El documento debe tener al menos un item");
		}

		for (let i = 0; i < input.items.length; i++) {
			const item = input.items[i];
			if (!item) continue;

			if (!item.description || item.description.length < 3) {
				warnings.push(`Item ${i + 1}: Descripción muy corta`);
			}

			if (item.quantity <= 0) {
				errors.push(`Item ${i + 1}: Cantidad debe ser mayor a 0`);
			}

			if (item.unitPrice < 0) {
				errors.push(`Item ${i + 1}: Precio unitario no puede ser negativo`);
			}
		}

		// 9. Bancarización warning
		if (input.total > 2000) {
			warnings.push(
				"Monto supera S/ 2,000 - Requiere medio de pago bancarizado",
			);
		}

		// Determine if human approval is needed
		const requiresHumanApproval = errors.length > 0 || input.total > 10000;

		return {
			valid: errors.length === 0,
			errors,
			warnings,
			requiresHumanApproval,
		};
	},
};

/**
 * Apply guardrail to SUNAT agent
 * @param data - Input for data.
 * @param action - Input for action.
 * @returns Result of withSunatGuardrail.
 * @example
 * ```ts
 * const result = await withSunatGuardrail({} as SUNATSubmissionData, undefined);
 * console.log(result);
 * ```
 * @typeParam T - Generic type parameter for withSunatGuardrail.
 */

export async function withSunatGuardrail<T>(
	data: SUNATSubmissionData,
	action: () => Promise<T>,
): Promise<{ result?: T; guardrail: GuardrailResult }> {
	const guardrail = await sunatGuardrail.validate(data);

	if (!guardrail.valid) {
		console.error("[SUNAT Guardrail] Validation failed:", guardrail.errors);
		return { guardrail };
	}

	if (guardrail.requiresHumanApproval) {
		console.warn(
			"[SUNAT Guardrail] Human approval required:",
			guardrail.warnings,
		);
		return { guardrail };
	}

	const result = await action();
	return { result, guardrail };
}
