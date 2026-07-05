/**
 * NATSConfig interface.
 *
 * @example
 * ```ts
 * const value: NATSConfig = {} as NATSConfig;
 * console.log(value);
 * ```
 */
export interface NATSConfig {
	url: string;
	reconnect?: boolean;
	maxReconnectAttempts?: number;
	reconnectTimeWait?: number;
}
