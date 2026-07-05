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

async function loadAuthDeps() {
	const [clerk, drizzle, nextNav, dbModule, schemaModule, errorsModule] =
		await Promise.all([
			import("@clerk/nextjs/server"),
			import("drizzle-orm"),
			import("next/navigation"),
			import("@drenyra/persistence"),
			import("@drenyra/persistence/schema"),
			import("@/shared/errors"),
		]);

	return {
		auth: clerk.auth,
		currentUser: clerk.currentUser,
		eq: drizzle.eq,
		redirect: nextNav.redirect,
		db: dbModule.db,
		users: schemaModule.users,
		organizations: schemaModule.organizations,
		BusinessRuleError: errorsModule.BusinessRuleError,
		UnauthorizedError: errorsModule.UnauthorizedError,
	};
}

/**
 * requireAuth operation.
 *
 * @returns Result of requireAuth.
 * @example
 * ```ts
 * const result = await requireAuth();
 * console.log(result);
 * ```
 */
export async function requireAuth(): Promise<string> {
	const { auth, redirect } = await loadAuthDeps();
	const { userId } = await auth();

	if (!userId) {
		redirect("/sign-in");
	}

	return userId as string;
}

/**
 * requireUser operation.
 *
 * @returns Result of requireUser.
 * @example
 * ```ts
 * const result = await requireUser();
 * console.log(result);
 * ```
 */
export async function requireUser(): Promise<User> {
	const { db, eq, users, redirect } = await loadAuthDeps();
	const userId = await requireAuth();

	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
	});

	if (!user) {
		redirect("/onboarding");
	}

	return user as User;
}

/**
 * requireOrganization operation.
 *
 * @returns Result of requireOrganization.
 * @throws Error when requireOrganization cannot complete successfully.
 * @example
 * ```ts
 * const result = await requireOrganization();
 * console.log(result);
 * ```
 */
export async function requireOrganization(): Promise<Organization> {
	const { db, eq, organizations, BusinessRuleError } = await loadAuthDeps();
	const user = await requireUser();

	const organization = await db.query.organizations.findFirst({
		where: eq(organizations.id, user.organizationId),
	});

	if (!organization) {
		throw new BusinessRuleError("Organization not found");
	}

	if (!organization.isActive) {
		throw new BusinessRuleError("Organization is inactive");
	}

	return organization as Organization;
}

/**
 * requireAuthContext operation.
 *
 * @returns Result of requireAuthContext.
 * @example
 * ```ts
 * const result = await requireAuthContext();
 * console.log(result);
 * ```
 */
export async function requireAuthContext(): Promise<AuthContext> {
	const user = await requireUser();
	const organization = await requireOrganization();

	return {
		userId: user.id,
		user,
		organization,
	};
}

/**
 * Legacy Clerk compatibility helper.
 *
 * @returns Result of getClerkUser.
 * @throws Error when getClerkUser cannot complete successfully.
 *
 * @deprecated Drenyra uses Better Auth as the active auth system. Keep this
 * helper only for migrations or legacy compatibility paths.
 * @example
 * ```ts
 * const result = await getClerkUser();
 * console.log(result);
 * ```
 */
export async function getClerkUser() {
	const { currentUser, UnauthorizedError } = await loadAuthDeps();
	const user = await currentUser();

	if (!user) {
		throw new UnauthorizedError("Not signed in");
	}

	return user;
}

/**
 * Legacy Clerk compatibility sync helper.
 *
 * @param clerkUserId - Input for clerkUserId.
 * @returns Result of syncUserFromClerk.
 *
 * @deprecated Drenyra uses Better Auth as the active auth system. Keep this
 * helper only for migrations or legacy compatibility paths.
 * @example
 * ```ts
 * const result = await syncUserFromClerk("");
 * console.log(result);
 * ```
 */
export async function syncUserFromClerk(clerkUserId: string) {
	const { db, eq, users } = await loadAuthDeps();
	const clerkUser = await getClerkUser();

	const email =
		clerkUser.emailAddresses.find(
			(e) => e.id === clerkUser.primaryEmailAddressId,
		)?.emailAddress || "";

	const name =
		`${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User";

	const existingUser = await db.query.users.findFirst({
		where: eq(users.id, clerkUserId),
	});

	if (existingUser) {
		const [updated] = await db
			.update(users)
			.set({
				email,
				name,
				lastLoginAt: new Date(),
			})
			.where(eq(users.id, clerkUserId))
			.returning();

		return updated;
	}

	return null;
}

/**
 * createUserWithOrganization operation.
 *
 * @param clerkUserId - Input for clerkUserId.
 * @param organizationId - Input for organizationId.
 * @param role - Input for role.
 * @returns Result of createUserWithOrganization.
 * @example
 * ```ts
 * const result = await createUserWithOrganization("", 0, "owner");
 * console.log(result);
 * ```
 */
export async function createUserWithOrganization(
	clerkUserId: string,
	organizationId: number,
	role: "owner" | "senior" | "junior" | "client" = "owner",
) {
	const { db, users } = await loadAuthDeps();
	const clerkUser = await getClerkUser();

	const email =
		clerkUser.emailAddresses.find(
			(e) => e.id === clerkUser.primaryEmailAddressId,
		)?.emailAddress || "";

	const name =
		`${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User";

	const [user] = await db
		.insert(users)
		.values({
			id: clerkUserId,
			organizationId,
			email,
			name,
			role,
			lastLoginAt: new Date(),
		})
		.returning();

	return user;
}

/**
 * userBelongsToOrganization operation.
 *
 * @param userId - Input for userId.
 * @param organizationId - Input for organizationId.
 * @returns Result of userBelongsToOrganization.
 * @example
 * ```ts
 * const result = await userBelongsToOrganization("", 0);
 * console.log(result);
 * ```
 */
export async function userBelongsToOrganization(
	userId: string,
	organizationId: number,
): Promise<boolean> {
	const { db, eq, users } = await loadAuthDeps();
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
	});

	return (user as User | null)?.organizationId === organizationId;
}

/**
 * getUserOrganizationId operation.
 *
 * @returns Result of getUserOrganizationId.
 * @example
 * ```ts
 * const result = await getUserOrganizationId();
 * console.log(result);
 * ```
 */
export async function getUserOrganizationId(): Promise<number> {
	const user = await requireUser();
	return user.organizationId;
}

/**
 * getClientIP operation.
 *
 * @param headers - Input for headers.
 * @returns Result of getClientIP.
 * @example
 * ```ts
 * const result = getClientIP({} as Headers);
 * console.log(result);
 * ```
 */
export function getClientIP(headers: Headers): string | undefined {
	return (
		headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		headers.get("x-real-ip") ||
		undefined
	);
}

/**
 * getUserAgent operation.
 *
 * @param headers - Input for headers.
 * @returns Result of getUserAgent.
 * @example
 * ```ts
 * const result = getUserAgent({} as Headers);
 * console.log(result);
 * ```
 */
export function getUserAgent(headers: Headers): string | undefined {
	return headers.get("user-agent") || undefined;
}
