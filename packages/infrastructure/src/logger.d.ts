type LogLevel = "debug" | "info" | "warn" | "error";
interface LogContext {
    [key: string]: unknown;
}
interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: LogContext;
    source?: string;
}
declare function createLogger(source: string): {
    debug: (message: string, context?: LogContext) => void;
    info: (message: string, context?: LogContext) => void;
    warn: (message: string, context?: LogContext) => void;
    error: (message: string, context?: LogContext) => void;
};
export declare const logger: {
    debug: (message: string, context?: LogContext) => void;
    info: (message: string, context?: LogContext) => void;
    warn: (message: string, context?: LogContext) => void;
    error: (message: string, context?: LogContext) => void;
    create: typeof createLogger;
};
export declare const loggers: {
    queue: {
        debug: (message: string, context?: LogContext) => void;
        info: (message: string, context?: LogContext) => void;
        warn: (message: string, context?: LogContext) => void;
        error: (message: string, context?: LogContext) => void;
    };
    redis: {
        debug: (message: string, context?: LogContext) => void;
        info: (message: string, context?: LogContext) => void;
        warn: (message: string, context?: LogContext) => void;
        error: (message: string, context?: LogContext) => void;
    };
    ai: {
        debug: (message: string, context?: LogContext) => void;
        info: (message: string, context?: LogContext) => void;
        warn: (message: string, context?: LogContext) => void;
        error: (message: string, context?: LogContext) => void;
    };
    webhook: {
        debug: (message: string, context?: LogContext) => void;
        info: (message: string, context?: LogContext) => void;
        warn: (message: string, context?: LogContext) => void;
        error: (message: string, context?: LogContext) => void;
    };
    validation: {
        debug: (message: string, context?: LogContext) => void;
        info: (message: string, context?: LogContext) => void;
        warn: (message: string, context?: LogContext) => void;
        error: (message: string, context?: LogContext) => void;
    };
    hitl: {
        debug: (message: string, context?: LogContext) => void;
        info: (message: string, context?: LogContext) => void;
        warn: (message: string, context?: LogContext) => void;
        error: (message: string, context?: LogContext) => void;
    };
    worker: {
        debug: (message: string, context?: LogContext) => void;
        info: (message: string, context?: LogContext) => void;
        warn: (message: string, context?: LogContext) => void;
        error: (message: string, context?: LogContext) => void;
    };
};
export type { LogLevel, LogContext, LogEntry };
//# sourceMappingURL=logger.d.ts.map