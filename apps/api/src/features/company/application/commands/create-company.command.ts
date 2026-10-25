import { RUC } from "@drenyra/domain";
import { db } from "@drenyra/persistence/client";
import { and, eq } from "@drenyra/persistence/query";
import {
	authAuditLogs,
	authUserCompanies,
	companies,
	users,
} from "@drenyra/persistence/schema";
import { nanoid } from "nanoid";
import type { AccessibleCompany } from "../../../auth/handlers/company-membership";

export interface CreateCompanyInput {
	authUserId: string;
	ruc: string;
	businessName: string;
	tradeName?: string | undefined;
	address?: string | undefined;
}

export type CreateCompanyResult =
	| { ok: true; company: AccessibleCompany }
	| { ok: false; code: "RUC_INVALID" | "NAME_REQUIRED" | "RUC_TAKEN" };

const UNIQUE_VIOLATION = "23505";

/**
 * `companies.owner_id` still points at the legacy `users` table. Each Better
 * Auth user gets one placeholder row there, keyed by a reserved `.invalid`
 * address so it can never collide with (or adopt) a real legacy account. It
 * holds no usable password; nothing signs in through it.
 */
function legacyOwnerEmail(authUserId: string): string {
	return `${authUserId}@owners.drenyra.invalid`;
}

function isUniqueViolation(error: unknown): boolean {
	const seen = new Set<unknown>();
	let current: unknown = error;
	while (current && typeof current === "object" && !seen.has(current)) {
		seen.add(current);
		if ((current as { code?: unknown }).code === UNIQUE_VIOLATION) return true;
		current = (current as { cause?: unknown }).cause;
	}
	return false;
}

function cleanText(value: string | undefined, max: number): string | null {
	const text = (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
	return text.length > 0 ? text : null;
}

/**
 * Registers a new company and makes the signed-in user its OWNER.
 *
 * A RUC that already has a company is refused: joining an existing company
 * goes through an invitation from its owner, never through knowing its RUC.
 * The user's first company becomes their default one.
 */
export async function createCompanyForUser(
	input: CreateCompanyInput,
): Promise<CreateCompanyResult> {
	const ruc = input.ruc.trim();
	if (!RUC.isValid(ruc)) return { ok: false, code: "RUC_INVALID" };
	const businessName = cleanText(input.businessName, 255);
	if (!businessName) return { ok: false, code: "NAME_REQUIRED" };

	try {
		const company = await db.transaction(async (tx) => {
			const [taken] = await tx
				.select({ id: companies.id })
				.from(companies)
				.where(eq(companies.ruc, ruc))
				.limit(1);
			if (taken) return null;

			const email = legacyOwnerEmail(input.authUserId);
			await tx
				.insert(users)
				.values({ email, password: "!", name: businessName, role: "OWNER" })
				.onConflictDoNothing({ target: users.email });
			const [owner] = await tx
				.select({ id: users.id })
				.from(users)
				.where(eq(users.email, email))
				.limit(1);
			if (!owner) throw new Error("Legacy owner row was not created");

			const [created] = await tx
				.insert(companies)
				.values({
					ownerId: owner.id,
					ruc,
					businessName,
					tradeName: cleanText(input.tradeName, 255),
					address: cleanText(input.address, 500),
				})
				.returning({
					id: companies.id,
					countryCode: companies.countryCode,
				});
			if (!created) throw new Error("Company row was not created");

			const [existingDefault] = await tx
				.select({ id: authUserCompanies.id })
				.from(authUserCompanies)
				.where(
					and(
						eq(authUserCompanies.userId, input.authUserId),
						eq(authUserCompanies.isDefault, true),
					),
				)
				.limit(1);
			const isDefault = !existingDefault;

			await tx.insert(authUserCompanies).values({
				id: `${input.authUserId}:${created.id}`,
				userId: input.authUserId,
				companyId: created.id,
				membershipRole: "OWNER",
				isDefault,
			});
			await tx.insert(authAuditLogs).values({
				id: nanoid(),
				userId: input.authUserId,
				action: "COMPANY_CREATED",
				timestamp: new Date(),
				details: { companyId: created.id },
			});

			return {
				companyId: created.id,
				companyName: businessName,
				ruc,
				countryCode: created.countryCode,
				membershipRole: "OWNER",
				isDefault,
			} satisfies AccessibleCompany;
		});
		return company ? { ok: true, company } : { ok: false, code: "RUC_TAKEN" };
	} catch (error) {
		// Two sign-ups racing for the same RUC: the unique index picks one.
		if (isUniqueViolation(error)) return { ok: false, code: "RUC_TAKEN" };
		throw error;
	}
}
