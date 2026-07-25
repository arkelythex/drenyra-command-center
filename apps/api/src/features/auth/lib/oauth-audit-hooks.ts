import { db } from "@drenyra/persistence/client";
import { authAuditLogs } from "@drenyra/persistence/schema";

interface AccountCreatedPayload {
	id: string;
	userId: string;
	providerId: string;
	accountId: string;
	[key: string]: unknown;
}

/**
 * oauthAuditHooks provides Better Auth database hooks for OAuth audit logging.
 *
 * On every OAuth account creation (account.create.after), an audit log row
 * is inserted into authAuditLogs recording the action "login_oauth" and
 * the providerId in the details JSONB column.
 */
export const oauthAuditHooks = {
	account: {
		create: {
			after: async (account: AccountCreatedPayload): Promise<void> => {
				const userId = account.userId?.trim();
				if (!userId) {
					return;
				}

				await db.insert(authAuditLogs).values({
					id: crypto.randomUUID(),
					userId,
					action: "login_oauth",
					timestamp: new Date(),
					ipAddress: undefined,
					userAgent: undefined,
					details: { providerId: account.providerId },
				});
			},
		},
	},
} as const;
