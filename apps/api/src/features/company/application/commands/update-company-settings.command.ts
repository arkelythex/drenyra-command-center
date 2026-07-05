import { companies } from "@drenyra/infrastructure";
import { db } from "@drenyra/persistence/client";
import { eq } from "drizzle-orm";
import type { CompanySettingsResult } from "../queries/get-company-settings.query";

export interface UpdateCompanySettingsInput {
	companyId: string;
	language?: string;
	timezone?: string;
	currency?: string;
	companyName?: string;
	companyRuc?: string;
	autoClosePeriod?: boolean;
	showAmountsInWords?: boolean;
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

export async function updateCompanySettings(
	input: UpdateCompanySettingsInput,
): Promise<CompanySettingsResult | null> {
	const [updated] = await db
		.update(companies)
		.set({
			settingsLanguage: input.language,
			settingsTimezone: input.timezone,
			settingsCurrency: input.currency,
			businessName: input.companyName,
			ruc: input.companyRuc,
			settingsAutoClosePeriod: input.autoClosePeriod,
			settingsShowAmountsInWords: input.showAmountsInWords,
			updatedAt: new Date(),
		})
		.where(eq(companies.id, input.companyId))
		.returning();

	if (!updated) return null;
	return serializeCompanySettings(updated);
}
