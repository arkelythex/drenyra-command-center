import { fail } from "./api-response";

function isProduction(): boolean {
	return process.env.NODE_ENV === "production";
}

export function getSafeErrorMessage(
	error: unknown,
	fallback = "Internal server error",
): string {
	if (isProduction()) {
		return fallback;
	}
	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}
	return fallback;
}

export function safeFail(
	error: unknown,
	code: string,
	fallbackMsg?: string,
): ReturnType<typeof fail> {
	return fail(getSafeErrorMessage(error, fallbackMsg), code);
}
