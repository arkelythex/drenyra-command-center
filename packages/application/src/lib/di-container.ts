/**
 * ServiceToken type.
 *
 * @example
 * ```ts
 * const value: ServiceToken = {} as ServiceToken;
 * console.log(value);
 * ```
 * @typeParam T - Generic type parameter for ServiceToken.
 */

export type ServiceToken<T> = string & { readonly __type?: T };

const registry = new Map<string, unknown>();

/**
 * SERVICE_TOKENS const.
 *
 * @example
 * ```ts
 * console.log(SERVICE_TOKENS);
 * ```
 */
export const SERVICE_TOKENS = {
	BALANCE_REPORT_DATA_SOURCE: "BALANCE_REPORT_DATA_SOURCE" as ServiceToken<unknown>,
	ORGANIZATION_REPORT_DATA_SOURCE:
		"ORGANIZATION_REPORT_DATA_SOURCE" as ServiceToken<unknown>,
	LEDGER_REPORT_DATA_SOURCE: "LEDGER_REPORT_DATA_SOURCE" as ServiceToken<unknown>,
	OPENING_BALANCE_DATA_SOURCE:
		"OPENING_BALANCE_DATA_SOURCE" as ServiceToken<unknown>,
} as const;

/**
 * register operation.
 *
 * @param token - Input for token.
 * @param value - Input for value.
 * @returns Result of register.
 * @example
 * ```ts
 * const result = register({} as ServiceToken, {} as T);
 * console.log(result);
 * ```
 * @typeParam T - Generic type parameter for register.
 */

export function register<T>(token: ServiceToken<T>, value: T): void {
	registry.set(token, value);
}

/**
 * inject operation.
 *
 * @param token - Input for token.
 * @returns Result of inject.
 * @example
 * ```ts
 * const result = inject({} as ServiceToken);
 * console.log(result);
 * ```
 * @typeParam T - Generic type parameter for inject.
 */

export function inject<T>(token: ServiceToken<T>): T | undefined {
	return registry.get(token) as T | undefined;
}

