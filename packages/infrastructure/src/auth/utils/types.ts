/**
 * AuthContext interface.
 *
 * @example
 * ```ts
 * const value: AuthContext = {} as AuthContext;
 * console.log(value);
 * ```
 */
export interface AuthContext {
	userId: string;
	user: User;
	organization: Organization;
}

/**
 * Organization interface.
 *
 * @example
 * ```ts
 * const value: Organization = {} as Organization;
 * console.log(value);
 * ```
 */
export interface Organization {
	id: number;
	isActive: boolean;
	[key: string]: unknown;
}

/**
 * User interface.
 *
 * @example
 * ```ts
 * const value: User = {} as User;
 * console.log(value);
 * ```
 */
export interface User {
	id: string;
	organizationId: number;
	[key: string]: unknown;
}
