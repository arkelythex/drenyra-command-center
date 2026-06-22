type LogLevel = "debug" | "info" | "warn" | "error";

function shouldLog(level: LogLevel): boolean {
  if (process.env.NODE_ENV === "production") {
    return level === "warn" || level === "error";
  }
  return true;
}

function log(level: LogLevel, namespace: string, message: string, ...args: unknown[]): void {
  if (!shouldLog(level)) return;

  const prefix = `[${namespace}]`;
  switch (level) {
    case "debug":
      // eslint-disable-next-line no-console
      console.debug(prefix, message, ...args);
      break;
    case "info":
      // eslint-disable-next-line no-console
      console.info(prefix, message, ...args);
      break;
    case "warn":
      console.warn(prefix, message, ...args);
      break;
    case "error":
      console.error(prefix, message, ...args);
      break;
  }
}

export const analyticsLogger = {
  debug: (message: string, ...args: unknown[]) => log("debug", "Analytics", message, ...args),
  info: (message: string, ...args: unknown[]) => log("info", "Analytics", message, ...args),
  warn: (message: string, ...args: unknown[]) => log("warn", "Analytics", message, ...args),
  error: (message: string, ...args: unknown[]) => log("error", "Analytics", message, ...args),
};
