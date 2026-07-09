export class BusinessRuleError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "BusinessRuleError";
	}
}

export class UnauthorizedError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "UnauthorizedError";
	}
}
