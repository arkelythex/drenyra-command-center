import pino from "pino";
export declare const REDACTION_PLACEHOLDER = "[REDACTED]";
export declare function redactLogPayload(payload: unknown): unknown;
export declare const rootLogger: pino.Logger<never, boolean>;
export declare function createLogger(
	context: Record<string, unknown>,
): pino.Logger<never, boolean>;
export declare function logRequest(
	method: string,
	path: string,
	statusCode: number,
	duration: number,
	correlationId?: string,
): void;
export declare function logOperation<T>(
	operation: string,
	context: Record<string, unknown>,
	fn: () => Promise<T>,
): Promise<T>;
//# sourceMappingURL=logger.d.ts.map
