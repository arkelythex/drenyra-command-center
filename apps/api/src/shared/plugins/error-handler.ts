/**
 * Global Error Handler — Elysia Plugin
 *
 * Single central error handler that replaces ⌀10 scattered local handlers.
 * Must be registered **after** `metricsMiddleware` (so metrics record first)
 * and **before** all feature modules (so it catches their unhandled errors).
 *
 * ## Behaviour
 *
 * | Error kind              | HTTP  | ErrorCode          | Log level |
 * |-------------------------|-------|--------------------|-----------|
 * | AppError (domain)       | *     | *                  | warn      |
 * | VALIDATION (Elysia)     | 422   | VALIDATION_ERROR   | warn      |
 * | NOT_FOUND (Elysia)      | 404   | NOT_FOUND          | info      |
 * | PARSE (Elysia)          | 400   | BAD_REQUEST        | warn      |
 * | INTERNAL_SERVER_ERROR   | 500   | INTERNAL_ERROR     | error     |
 * | UNKNOWN / everything    | 500   | INTERNAL_ERROR     | error     |
 *
 * @module plugins/error-handler
 */

import type { Elysia } from "elysia";
import { fail, getErrorMessage } from "../../features/shared/api-response";
import { AppError } from "../../lib/errors";
import { createLogger } from "../../lib/logger";
import { ErrorCodes } from "../../shared/error-codes";

const errorLogger = createLogger({ module: "error-handler" });

export const globalErrorHandler = (app: Elysia) =>
	app.onError(({ code, error, set, request }) => {
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;
		const correlationId = request.headers.get("x-correlation-id") ?? "unknown";

		// 1. Domain errors (AppError hierarchy) — exact status + code.
		if (error instanceof AppError) {
			set.status = error.statusCode;
			errorLogger.warn(
				{
					error: error.message,
					errorCode: error.errorCode,
					path,
					method,
					correlationId,
				},
				error.message,
			);
			return fail(error.message, error.errorCode, {
				details: error.details,
			});
		}

		// 2. Elysia-known error codes.
		switch (code) {
			case "VALIDATION": {
				set.status = 422;
				errorLogger.warn(
					{ error: getErrorMessage(error), path, method, correlationId },
					"Validation error",
				);
				return fail(
					"Validation failed",
					ErrorCodes.VALIDATION_ERROR,
					process.env.NODE_ENV !== "production"
						? { details: getErrorMessage(error) }
						: undefined,
				);
			}

			case "NOT_FOUND": {
				set.status = 404;
				errorLogger.info({ path, method, correlationId }, "Route not found");
				return fail("Route not found", ErrorCodes.NOT_FOUND);
			}

			case "PARSE": {
				set.status = 400;
				errorLogger.warn(
					{ error: getErrorMessage(error), path, method, correlationId },
					"Request parse error",
				);
				return fail("Invalid request format", ErrorCodes.BAD_REQUEST);
			}

			default: {
				set.status = 500;
				errorLogger.error(
					{
						error:
							error instanceof Error
								? (error.stack ?? error.message)
								: String(error),
						code,
						path,
						method,
						correlationId,
					},
					"Unhandled error",
				);
				return fail("Internal server error", ErrorCodes.INTERNAL_ERROR);
			}
		}
	});
