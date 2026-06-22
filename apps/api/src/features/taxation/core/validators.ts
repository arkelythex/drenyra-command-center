import { fail, getErrorMessage } from "../../shared/api-response";
import { PercepcionApplyError } from "../application/commands/apply-percepcion.command";
import { RetentionApplyError } from "../application/commands/apply-retention.command";
import { PercepcionLifecycleError } from "../application/errors/percepcion-lifecycle.error";
import { RetentionLifecycleError } from "../application/errors/retention-lifecycle.error";
import type { SetStatus } from "./types";

export function handleRetentionCommandError(
	error: unknown,
	set: SetStatus,
): ReturnType<typeof fail> {
	if (error instanceof RetentionApplyError) {
		set.status = error.httpStatus;
		return fail(error.message, error.errorCode);
	}
	if (error instanceof RetentionLifecycleError) {
		set.status = error.httpStatus;
		return fail(error.message, error.errorCode);
	}
	set.status = 500;
	return fail(getErrorMessage(error), "INTERNAL_ERROR");
}

export function handlePercepcionCommandError(
	error: unknown,
	set: SetStatus,
): ReturnType<typeof fail> {
	if (error instanceof PercepcionApplyError) {
		set.status = error.httpStatus;
		return fail(error.message, error.errorCode);
	}
	if (error instanceof PercepcionLifecycleError) {
		set.status = error.httpStatus;
		return fail(error.message, error.errorCode);
	}
	set.status = 500;
	return fail(getErrorMessage(error), "INTERNAL_ERROR");
}
