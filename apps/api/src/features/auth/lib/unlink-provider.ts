import { db } from "@drenyra/persistence/client";
import { authAccounts } from "@drenyra/persistence/schema";
import { and, eq } from "drizzle-orm";

interface UnlinkProviderInput {
	userId: string;
	providerId: string;
}

interface UnlinkProviderResult {
	success: boolean;
}

/**
 * unlinkProvider handles unlinking an OAuth provider from a user's account.
 *
 * Business rules:
 * - The last remaining account cannot be unlinked.
 * - Unlinking a non-primary account simply removes it.
 * - Unlinking the primary account promotes the next available account to primary.
 *
 * @throws {Error} If the user has only one sign-in method.
 * @throws {Error} If the provider is not linked to the user.
 */
export async function unlinkProvider(
	input: UnlinkProviderInput,
): Promise<UnlinkProviderResult> {
	const { userId, providerId } = input;

	// Fetch all accounts for this user
	const accounts = await db
		.select()
		.from(authAccounts)
		.where(eq(authAccounts.userId, userId));

	if (accounts.length === 0) {
		throw new Error("Cannot unlink your only sign-in method");
	}

	// Find the target account
	const targetAccount = accounts.find(
		(account) => account.providerId === providerId,
	);
	if (!targetAccount) {
		throw new Error("Provider not linked to this account");
	}

	// Guard: last account
	if (accounts.length === 1) {
		throw new Error("Cannot unlink your only sign-in method");
	}

	// Delete the target account
	await db
		.delete(authAccounts)
		.where(
			and(
				eq(authAccounts.userId, userId),
				eq(authAccounts.providerId, providerId),
			),
		);

	// If the deleted account was primary, promote the next available
	if (targetAccount.isPrimary) {
		const nextAccount = accounts.find(
			(account) => account.providerId !== providerId,
		);
		if (nextAccount) {
			await db
				.update(authAccounts)
				.set({ isPrimary: true })
				.where(
					and(
						eq(authAccounts.userId, userId),
						eq(authAccounts.providerId, nextAccount.providerId),
					),
				);
		}
	}

	return { success: true };
}
