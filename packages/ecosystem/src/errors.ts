export class ConnectorError extends Error {
	constructor(
		message: string,
		public readonly connectorName: string,
		public readonly cause?: unknown,
	) {
		super(`[${connectorName}] ${message}`);
		this.name = "ConnectorError";
	}
}

export class ConnectorTimeoutError extends ConnectorError {
	constructor(connectorName: string, timeoutMs: number) {
		super(`Operation timed out after ${timeoutMs}ms`, connectorName);
		this.name = "ConnectorTimeoutError";
	}
}

export class ConnectorAuthError extends ConnectorError {
	constructor(connectorName: string, reason: string) {
		super(`Authentication failed: ${reason}`, connectorName);
		this.name = "ConnectorAuthError";
	}
}

export class ConnectorUnavailableError extends ConnectorError {
	constructor(connectorName: string) {
		super("Service unavailable", connectorName);
		this.name = "ConnectorUnavailableError";
	}
}

export class ConnectorRateLimitError extends ConnectorError {
	constructor(
		connectorName: string,
		public readonly retryAfterMs: number,
	) {
		super(`Rate limited, retry after ${retryAfterMs}ms`, connectorName);
		this.name = "ConnectorRateLimitError";
	}
}
