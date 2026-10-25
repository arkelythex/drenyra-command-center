/**
 * A signed-in user gets a company only by creating it (onboarding) or by an
 * invitation; typing an existing company's RUC never grants access to it.
 *
 * Opt-in (RUN_DB_TESTS=1) because it needs PostgreSQL.
 */
import { randomUUID } from "node:crypto";
import { RUC } from "@drenyra/domain";
import { db } from "@drenyra/persistence/client";
import { eq, inArray } from "@drenyra/persistence/query";
import {
	authUserCompanies,
	authUsers,
	companies,
	users,
} from "@drenyra/persistence/schema";
import { afterEach, describe, expect, it } from "vitest";
import { enrichSessionUserWithCompanyContext } from "../../../auth/handlers/session-company-context";
import { createCompanyForUser } from "../../application/commands/create-company.command";

const describeDb = process.env.RUN_DB_TESTS === "1" ? describe : describe.skip;

const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/** A RUC with a valid check digit, unique per call. */
function freshRuc(): string {
	const body = `20${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;
	const sum = WEIGHTS.reduce((acc, w, i) => acc + w * Number(body[i]), 0);
	const digit = (11 - (sum % 11)) % 10;
	return `${body}${digit}`;
}

describeDb("company onboarding (postgres)", () => {
	const authUserIds: string[] = [];
	const rucs: string[] = [];

	async function signedUpUser(ruc = ""): Promise<string> {
		const id = `test-${randomUUID()}`;
		await db.insert(authUsers).values({
			id,
			name: "Contadora",
			email: `${id}@example.test`,
			emailVerified: true,
			ruc,
		});
		authUserIds.push(id);
		return id;
	}

	function ruc(): string {
		const value = freshRuc();
		rucs.push(value);
		return value;
	}

	async function membershipsOf(userId: string) {
		return db
			.select({
				companyId: authUserCompanies.companyId,
				membershipRole: authUserCompanies.membershipRole,
				isDefault: authUserCompanies.isDefault,
			})
			.from(authUserCompanies)
			.where(eq(authUserCompanies.userId, userId));
	}

	afterEach(async () => {
		if (authUserIds.length > 0) {
			await db
				.delete(authUserCompanies)
				.where(inArray(authUserCompanies.userId, authUserIds));
		}
		if (rucs.length > 0) {
			const rows = await db
				.select({ ownerId: companies.ownerId })
				.from(companies)
				.where(inArray(companies.ruc, rucs));
			await db.delete(companies).where(inArray(companies.ruc, rucs));
			const owners = rows.map((row) => row.ownerId);
			if (owners.length > 0) {
				await db.delete(users).where(inArray(users.id, owners));
			}
		}
		if (authUserIds.length > 0) {
			await db.delete(authUsers).where(inArray(authUsers.id, authUserIds));
		}
		authUserIds.length = 0;
		rucs.length = 0;
	});

	it("generates valid RUCs", () => {
		expect(RUC.isValid(freshRuc())).toBe(true);
	});

	it("creates the company with the user as its owner", async () => {
		const userId = await signedUpUser();
		const value = ruc();

		const result = await createCompanyForUser({
			authUserId: userId,
			ruc: value,
			businessName: "  Estudio Contable Andino S.A.C. ",
			address: "Av. Arequipa 100, Lima",
		});

		expect(result).toMatchObject({
			ok: true,
			company: {
				companyName: "Estudio Contable Andino S.A.C.",
				ruc: value,
				membershipRole: "OWNER",
				isDefault: true,
			},
		});
		const session = await enrichSessionUserWithCompanyContext({ id: userId });
		expect(session).toMatchObject({
			activeCompanyId: result.ok ? result.company.companyId : "",
			role: "owner",
		});
	});

	it("refuses a RUC that already has a company and grants nothing", async () => {
		const owner = await signedUpUser();
		const value = ruc();
		await createCompanyForUser({
			authUserId: owner,
			ruc: value,
			businessName: "Empresa Original S.A.C.",
		});
		const intruder = await signedUpUser();

		const result = await createCompanyForUser({
			authUserId: intruder,
			ruc: value,
			businessName: "Otra",
		});

		expect(result).toEqual({ ok: false, code: "RUC_TAKEN" });
		expect(await membershipsOf(intruder)).toEqual([]);
	});

	it("never joins a company because the user typed its RUC at signup", async () => {
		const owner = await signedUpUser();
		const value = ruc();
		await createCompanyForUser({
			authUserId: owner,
			ruc: value,
			businessName: "Empresa Original S.A.C.",
		});
		const intruder = await signedUpUser(value);

		const session = await enrichSessionUserWithCompanyContext({
			id: intruder,
			ruc: value,
		});

		expect(session?.availableCompanies ?? []).toEqual([]);
		expect(await membershipsOf(intruder)).toEqual([]);
	});

	it("rejects a RUC with a wrong check digit", async () => {
		const userId = await signedUpUser();
		const value = ruc();
		const wrong = `${value.slice(0, 10)}${(Number(value[10]) + 1) % 10}`;

		const result = await createCompanyForUser({
			authUserId: userId,
			ruc: wrong,
			businessName: "Empresa",
		});

		expect(result).toEqual({ ok: false, code: "RUC_INVALID" });
	});

	it("keeps the first company as default when the user adds another", async () => {
		const userId = await signedUpUser();
		const first = await createCompanyForUser({
			authUserId: userId,
			ruc: ruc(),
			businessName: "Primera S.A.C.",
		});
		const second = await createCompanyForUser({
			authUserId: userId,
			ruc: ruc(),
			businessName: "Segunda S.A.C.",
		});

		expect(second).toMatchObject({ ok: true, company: { isDefault: false } });
		const rows = await membershipsOf(userId);
		expect(rows).toHaveLength(2);
		expect(rows.filter((row) => row.isDefault)).toEqual([
			expect.objectContaining({
				companyId: first.ok ? first.company.companyId : "",
			}),
		]);
	});
});
