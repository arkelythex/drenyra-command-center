import { eq } from "drizzle-orm";
import { db } from "../../client";
import { companies, organizations } from "../../schema";
export const resolveCompanyIdFromOrganization = async (organizationId) => {
	const orgRows = await db
		.select({ ruc: organizations.ruc })
		.from(organizations)
		.where(eq(organizations.id, organizationId))
		.limit(1);
	if (orgRows.length === 0) {
		throw new Error(`Organization ${organizationId} not found`);
	}
	const companyRows = await db
		.select({ id: companies.id })
		.from(companies)
		.where(eq(companies.ruc, orgRows[0].ruc))
		.limit(1);
	if (companyRows.length === 0) {
		throw new Error(
			`Company mapped from organization ${organizationId} not found`,
		);
	}
	return companyRows[0].id;
};
export const tryResolveCompanyIdFromOrganization = async (organizationId) => {
	try {
		return await resolveCompanyIdFromOrganization(organizationId);
	} catch {
		return null;
	}
};
export const resolveOrganizationIdFromCompany = async (companyId) => {
	const companyRows = await db
		.select({ ruc: companies.ruc })
		.from(companies)
		.where(eq(companies.id, companyId))
		.limit(1);
	if (companyRows.length === 0) {
		throw new Error(`Company ${companyId} not found`);
	}
	const orgRows = await db
		.select({ id: organizations.id })
		.from(organizations)
		.where(eq(organizations.ruc, companyRows[0].ruc))
		.limit(1);
	if (orgRows.length === 0) {
		throw new Error(`Organization mapped from company ${companyId} not found`);
	}
	return orgRows[0].id;
};
export const tryResolveOrganizationIdFromCompany = async (companyId) => {
	try {
		return await resolveOrganizationIdFromCompany(companyId);
	} catch {
		return null;
	}
};
