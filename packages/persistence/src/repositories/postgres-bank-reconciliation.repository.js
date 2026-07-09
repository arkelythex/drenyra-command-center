import { BankReconciliation } from "@drenyra/domain/entities/BankReconciliation";
import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "../client";
import { bankReconciliations } from "../schema";
import {
	resolveCompanyIdFromOrganization,
	resolveOrganizationIdFromCompany,
} from "./support/organization-resolver";
import { toStableUuid } from "./support/stable-uuid";

const idToUuid = (id) => toStableUuid(`legacy-bank-reconciliation:${id}`);
const accountIdToUuid = (id) => toStableUuid(`legacy-bank-account:${id}`);
const uuidToLegacyId = (id) => {
	const numeric = Number.parseInt(id.replace(/\D/g, "").slice(0, 9), 10);
	return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
};
const toDateString = (date) => date.toISOString().slice(0, 10);
const toDecimal = (value) => value.toFixed(2);
function mapDbStatusToDomain(dbStatus) {
	switch (dbStatus) {
		case "completed":
			return "COMPLETED";
		case "cancelled":
			return "CANCELLED";
		default:
			return "DRAFT";
	}
}
function mapDomainStatusToDb(domainStatus) {
	switch (domainStatus) {
		case "COMPLETED":
			return "completed";
		case "CANCELLED":
			return "cancelled";
		default:
			return "draft";
	}
}
export class PostgresBankReconciliationRepository {
	async save(reconciliation) {
		const companyId = await resolveCompanyIdFromOrganization(
			reconciliation.organizationId,
		);
		const [saved] = await db
			.insert(bankReconciliations)
			.values({
				id:
					reconciliation.id > 0
						? idToUuid(reconciliation.id)
						: toStableUuid(
								`legacy-bank-reconciliation:${companyId}:${reconciliation.bankAccountId}:${reconciliation.periodStart.toISOString()}`,
							),
				companyId,
				accountId: accountIdToUuid(reconciliation.bankAccountId),
				startDate: toDateString(reconciliation.periodStart),
				endDate: toDateString(reconciliation.periodEnd),
				openingBalance: toDecimal(reconciliation.openingBalance),
				closingBalance: toDecimal(reconciliation.closingBalanceBooks),
				statementBalance: toDecimal(reconciliation.closingBalanceStatement),
				status: mapDomainStatusToDb(reconciliation.status),
				difference: toDecimal(reconciliation.difference),
				notes: reconciliation.notes ?? null,
				createdAt: reconciliation.createdAt,
				completedAt: reconciliation.completedAt ?? null,
				completedBy: reconciliation.reconciledByUserId ?? null,
			})
			.returning();
		if (!saved) throw new Error("Failed to create reconciliation");
		return this.mapToDomain(saved, reconciliation.organizationId);
	}
	async update(reconciliation) {
		const companyId = await resolveCompanyIdFromOrganization(
			reconciliation.organizationId,
		);
		const [updated] = await db
			.update(bankReconciliations)
			.set({
				endDate: toDateString(reconciliation.periodEnd),
				closingBalance: toDecimal(reconciliation.closingBalanceBooks),
				statementBalance: toDecimal(reconciliation.closingBalanceStatement),
				status: mapDomainStatusToDb(reconciliation.status),
				difference: toDecimal(reconciliation.difference),
				notes: reconciliation.notes ?? null,
				completedAt: reconciliation.completedAt ?? null,
				completedBy: reconciliation.reconciledByUserId ?? null,
			})
			.where(
				and(
					eq(bankReconciliations.id, idToUuid(reconciliation.id)),
					eq(bankReconciliations.companyId, companyId),
				),
			)
			.returning();
		return updated
			? this.mapToDomain(updated, reconciliation.organizationId)
			: reconciliation;
	}
	async findById(id, organizationId) {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const row = await db.query.bankReconciliations.findFirst({
			where: and(
				eq(bankReconciliations.id, idToUuid(id)),
				eq(bankReconciliations.companyId, companyId),
			),
		});
		return row ? this.mapToDomain(row, organizationId) : null;
	}
	async findAll(organizationId, filters) {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const rows = await db.query.bankReconciliations.findMany({
			where: and(...this.buildConditions(companyId, filters)),
			orderBy: [desc(bankReconciliations.endDate)],
		});
		return Promise.all(
			rows.map((row) => this.mapToDomain(row, organizationId)),
		);
	}
	async findLatestByBankAccount(bankAccountId) {
		const row = await db.query.bankReconciliations.findFirst({
			where: eq(bankReconciliations.accountId, accountIdToUuid(bankAccountId)),
			orderBy: [desc(bankReconciliations.endDate)],
		});
		return row ? this.mapToDomain(row) : null;
	}
	async findPending(organizationId) {
		return this.findAll(organizationId, { status: "DRAFT" });
	}
	async count(organizationId, filters) {
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		const [result] = await db
			.select({ value: count() })
			.from(bankReconciliations)
			.where(and(...this.buildConditions(companyId, filters)));
		return result?.value ?? 0;
	}
	async delete(id, organizationId) {
		const existing = await this.findById(id, organizationId);
		if (!existing) throw new Error("Conciliación no encontrada");
		if (existing.status !== "DRAFT")
			throw new Error("Solo se pueden eliminar conciliaciones en borrador");
		const companyId = await resolveCompanyIdFromOrganization(organizationId);
		await db
			.delete(bankReconciliations)
			.where(
				and(
					eq(bankReconciliations.id, idToUuid(id)),
					eq(bankReconciliations.companyId, companyId),
				),
			);
	}
	buildConditions(companyId, filters) {
		const conditions = [eq(bankReconciliations.companyId, companyId)];
		if (filters?.bankAccountId)
			conditions.push(
				eq(
					bankReconciliations.accountId,
					accountIdToUuid(filters.bankAccountId),
				),
			);
		if (filters?.status)
			conditions.push(
				eq(bankReconciliations.status, mapDomainStatusToDb(filters.status)),
			);
		if (filters?.periodFrom)
			conditions.push(
				gte(bankReconciliations.startDate, toDateString(filters.periodFrom)),
			);
		if (filters?.periodTo)
			conditions.push(
				lte(bankReconciliations.endDate, toDateString(filters.periodTo)),
			);
		return conditions;
	}
	async mapToDomain(raw, organizationId) {
		const resolvedOrganizationId =
			organizationId ?? (await resolveOrganizationIdFromCompany(raw.companyId));
		const createdAt = raw.createdAt ?? new Date();
		return BankReconciliation.create({
			id: uuidToLegacyId(raw.id),
			bankAccountId: uuidToLegacyId(raw.accountId),
			organizationId: resolvedOrganizationId,
			periodStart: new Date(raw.startDate),
			periodEnd: new Date(raw.endDate),
			openingBalance: Number(raw.openingBalance),
			closingBalanceStatement: Number(
				raw.statementBalance ?? raw.closingBalance,
			),
			closingBalanceBooks: Number(raw.closingBalance),
			difference: Number(raw.difference ?? 0),
			status: mapDbStatusToDomain(raw.status),
			reconciledTransactionIds: [],
			reconciledByUserId: raw.completedBy ?? undefined,
			notes: raw.notes ?? undefined,
			createdAt,
			updatedAt: raw.completedAt ?? createdAt,
			completedAt: raw.completedAt ?? undefined,
		});
	}
}

