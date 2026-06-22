/**
 * Builder pattern for User test data.
 *
 * Creates user objects for authentication and authorization testing.
 *
 * @example
 * ```ts
 * const user = new UserBuilder()
 *   .withRole('admin')
 *   .withTenantId(1)
 *   .build();
 * ```
 */
import { BaseBuilder } from "./base.builder";

const DEFAULT_USER_ID = "usr_test_001";
const DEFAULT_EMAIL = "test.user@arkelythexfounders.com";
const DEFAULT_NAME = "Usuario de Prueba";
const DEFAULT_ROLE = "user";
const DEFAULT_TENANT_ID = 1;

export interface UserData {
	id: string;
	email: string;
	name: string;
	role: string;
	tenantId: number;
	isActive: boolean;
	emailVerified: boolean;
	lastLoginAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export class UserBuilder extends BaseBuilder<UserData> {
	constructor() {
		const now = new Date();
		super({
			id: DEFAULT_USER_ID,
			email: DEFAULT_EMAIL,
			name: DEFAULT_NAME,
			role: DEFAULT_ROLE,
			tenantId: DEFAULT_TENANT_ID,
			isActive: true,
			emailVerified: true,
			createdAt: now,
			updatedAt: now,
		});
	}

	/**
	 * Set the user ID.
	 */
	withId(id: string): this {
		return this.set({ id });
	}

	/**
	 * Set the email address.
	 */
	withEmail(email: string): this {
		return this.set({ email });
	}

	/**
	 * Set the display name.
	 */
	withName(name: string): this {
		return this.set({ name });
	}

	/**
	 * Set the user role.
	 */
	withRole(role: string): this {
		return this.set({ role });
	}

	/**
	 * Set the tenant/organization ID.
	 */
	withTenantId(tenantId: number): this {
		return this.set({ tenantId });
	}

	/**
	 * Mark user as inactive.
	 */
	asInactive(): this {
		return this.set({ isActive: false });
	}

	/**
	 * Mark user as active.
	 */
	asActive(): this {
		return this.set({ isActive: true });
	}

	/**
	 * Mark email as unverified.
	 */
	asUnverified(): this {
		return this.set({ emailVerified: false });
	}

	/**
	 * Set the last login timestamp.
	 */
	withLastLoginAt(date: Date): this {
		return this.set({ lastLoginAt: date });
	}

	/**
	 * Build the User data object.
	 */
	build(): UserData {
		const now = new Date();
		return {
			id: this.data.id ?? DEFAULT_USER_ID,
			email: this.data.email ?? DEFAULT_EMAIL,
			name: this.data.name ?? DEFAULT_NAME,
			role: this.data.role ?? DEFAULT_ROLE,
			tenantId: this.data.tenantId ?? DEFAULT_TENANT_ID,
			isActive: this.data.isActive ?? true,
			emailVerified: this.data.emailVerified ?? true,
			lastLoginAt: this.data.lastLoginAt,
			createdAt: this.data.createdAt ?? now,
			updatedAt: this.data.updatedAt ?? now,
		};
	}
}
