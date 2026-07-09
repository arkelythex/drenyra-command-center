import { ValidationError } from "./AppError";

export class InvalidRUCError extends ValidationError {
	override readonly code: string = "FISCAL_INVALID_RUC";

	constructor(
		public readonly invalidValue: string,
		message?: string,
	) {
		super(
			"ruc",
			message ||
				`RUC invalido: "${invalidValue}". Debe tener 11 digitos y pasar validacion modulo-11`,
		);
	}

	override toJSON() {
		return {
			...super.toJSON(),
			invalidValue: this.invalidValue,
		};
	}
}
