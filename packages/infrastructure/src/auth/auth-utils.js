async function loadAuthDeps() {
    const [clerk, drizzle, nextNav, dbModule, schemaModule, errorsModule] = await Promise.all([
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
export async function requireAuth() {
    const { auth, redirect } = await loadAuthDeps();
    const { userId } = await auth();
    if (!userId) {
        redirect("/sign-in");
    }
    return userId;
}
export async function requireUser() {
    const { db, eq, users, redirect } = await loadAuthDeps();
    const userId = await requireAuth();
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });
    if (!user) {
        redirect("/onboarding");
    }
    return user;
}
export async function requireOrganization() {
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
    return organization;
}
export async function requireAuthContext() {
    const user = await requireUser();
    const organization = await requireOrganization();
    return {
        userId: user.id,
        user,
        organization,
    };
}
export async function getClerkUser() {
    const { currentUser, UnauthorizedError } = await loadAuthDeps();
    const user = await currentUser();
    if (!user) {
        throw new UnauthorizedError("Not signed in");
    }
    return user;
}
export async function syncUserFromClerk(clerkUserId) {
    const { db, eq, users } = await loadAuthDeps();
    const clerkUser = await getClerkUser();
    const email = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress || "";
    const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User";
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
export async function createUserWithOrganization(clerkUserId, organizationId, role = "owner") {
    const { db, users } = await loadAuthDeps();
    const clerkUser = await getClerkUser();
    const email = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress || "";
    const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User";
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
export async function userBelongsToOrganization(userId, organizationId) {
    const { db, eq, users } = await loadAuthDeps();
    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });
    return user?.organizationId === organizationId;
}
export async function getUserOrganizationId() {
    const user = await requireUser();
    return user.organizationId;
}
export function getClientIP(headers) {
    return (headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headers.get("x-real-ip") ||
        undefined);
}
export function getUserAgent(headers) {
    return headers.get("user-agent") || undefined;
}
//# sourceMappingURL=auth-utils.js.map