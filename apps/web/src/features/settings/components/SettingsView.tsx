import { Settings } from "lucide-react";
import { useSettingsGeneral } from "../hooks/use-settings-general";
import { SettingsShell } from "./SettingsShell";
import { CompanySettingsSection } from "./settings-view/company-section";
import { SettingsFooterActions } from "./settings-view/footer-actions";
import { OperationalSettingsSection } from "./settings-view/operational-section";
import { RegionSettingsSection } from "./settings-view/region-section";

export const SettingsView = () => {
	const {
		language,
		timezone,
		currency,
		companyName,
		companyRuc,
		autoClosePeriod,
		showAmountsInWords,
		setLanguage,
		setTimezone,
		setCurrency,
		setCompanyName,
		setCompanyRuc,
		setAutoClosePeriod,
		setShowAmountsInWords,
		isSaving,
		error,
	} = useSettingsGeneral();

	return (
		<SettingsShell
			title="Configuración general"
			description="Define idioma, región y comportamiento base del espacio de trabajo para que toda la operación contable sea consistente."
			icon={Settings}
			badge="Base del espacio de trabajo"
		>
			<RegionSettingsSection
				language={language}
				timezone={timezone}
				currency={currency}
				onLanguageChange={setLanguage}
				onTimezoneChange={setTimezone}
				onCurrencyChange={setCurrency}
			/>

			<CompanySettingsSection
				companyName={companyName}
				companyRuc={companyRuc}
				onCompanyNameChange={setCompanyName}
				onCompanyRucChange={setCompanyRuc}
			/>

			<OperationalSettingsSection
				autoClosePeriod={autoClosePeriod}
				showAmountsInWords={showAmountsInWords}
				onAutoCloseChange={setAutoClosePeriod}
				onShowAmountsInWordsChange={setShowAmountsInWords}
			/>

			<SettingsFooterActions isSaving={isSaving} error={error} />
		</SettingsShell>
	);
};
