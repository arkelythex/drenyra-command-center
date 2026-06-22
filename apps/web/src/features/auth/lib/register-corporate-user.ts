export interface RegisterCorporateUserInput {
	email: string;
	password: string;
	name: string;
	ruc: string;
}

interface SignupFailurePayload {
	success?: false;
	error?: string;
	code?: string;
	field?: string;
}

interface SignupSuccessPayload {
	success?: true;
	data?: {
		message?: string;
		user?: unknown;
	};
}

function isSignupFailurePayload(
	payload: SignupFailurePayload | SignupSuccessPayload | null,
): payload is SignupFailurePayload {
	return payload?.success === false;
}

function isSignupSuccessPayload(
	payload: SignupFailurePayload | SignupSuccessPayload | null,
): payload is SignupSuccessPayload {
	return payload?.success === true;
}

export class RegisterCorporateUserError extends Error {
	constructor(
		message: string,
		public readonly code?: string,
		public readonly field?: string,
	) {
		super(message);
		this.name = "RegisterCorporateUserError";
	}
}

export async function registerCorporateUser(
	input: RegisterCorporateUserInput,
): Promise<string> {
	const response = await fetch("/api/auth/signup", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		credentials: "include",
		body: JSON.stringify(input),
	});

	const payload = (await response.json().catch(() => null)) as
		| SignupFailurePayload
		| SignupSuccessPayload
		| null;

	if (isSignupFailurePayload(payload)) {
		throw new RegisterCorporateUserError(
			(typeof payload.error === "string" && payload.error.trim()) ||
				"Error al crear cuenta",
			typeof payload.code === "string" ? payload.code : undefined,
			typeof payload.field === "string" ? payload.field : undefined,
		);
	}

	if (!response.ok) {
		throw new RegisterCorporateUserError("Error al crear cuenta");
	}

	if (
		isSignupSuccessPayload(payload) &&
		typeof payload.data?.message === "string"
	) {
		return payload.data.message;
	}

	return "Cuenta creada exitosamente. Revisa tu email para verificar tu cuenta.";
}
