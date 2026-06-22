export declare class SecureLogger {
    static namespace(serviceName: string): {
        debug: (message: string, context?: Record<string, unknown>) => void;
        info: (message: string, context?: Record<string, unknown>) => void;
        warn: (message: string, context?: Record<string, unknown>) => void;
        error: (message: string, error?: unknown, context?: Record<string, unknown>) => void;
    };
    static debug(message: string, context?: Record<string, unknown>): void;
    static info(message: string, context?: Record<string, unknown>): void;
    static warn(message: string, context?: Record<string, unknown>): void;
    static error(message: string, error?: unknown, context?: Record<string, unknown>): void;
    static audit(action: string, userId: string, resource: string, success: boolean, details?: Record<string, unknown>): void;
}
export declare const logger: typeof SecureLogger;
export default SecureLogger;
//# sourceMappingURL=secure-logger.d.ts.map