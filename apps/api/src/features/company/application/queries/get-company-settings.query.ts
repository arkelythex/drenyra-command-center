import { companies } from "@arkelythex/infrastructure";
import { db } from "@arkelythex/persistence/client";
import { eq } from "drizzle-orm";

export interface CompanySettingsResult {
	language: string | null;
	timezone: string | null;
	currency: string | null;
	companyName: string | null;
	companyRuc: string | null;
	autoClosePeriod: boolean | null;
	showAmountsInWords: boolean | null;
}

function serializeCompanySettings(
	company: typeof companies.$inferSelect,
): CompanySettingsResult {
	return {
		language: company.settingsLanguage,
		timezone: company.settingsTimezone,
		currency: company.settingsCurrency,
		companyName: company.businessName,
		companyRuc: company.ruc,
		autoClosePeriod: company.settingsAutoClosePeriod,
		showAmountsInWords: company.settingsShowAmountsInWords,
	};
}

export async function getCompanySettings(
	companyId: string,
): Promise<CompanySettingsResult | null> {
	const company = await db.query.companies.findFirst({
		where: eq(companies.id, companyId),
	});
	if (!company) return null;
	return serializeCompanySettings(company);
}
