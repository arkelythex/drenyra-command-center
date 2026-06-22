import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsShell } from "./SettingsShell";
import { CompanySettingsSection } from "./settings-view/company-section";
import { SettingsFooterActions } from "./settings-view/footer-actions";
import { OperationalSettingsSection } from "./settings-view/operational-section";
import { RegionSettingsSection } from "./settings-view/region-section";
import { useSettingsGeneral } from "../hooks/use-settings-general";

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
	} = useSettingsGeneral();

	return (
		<SettingsShell
			title="Configuración General"
			description="Define idioma, región y comportamiento base del workspace para que toda la operación contable sea consistente."
			icon={Settings}
			badge="BASE DEL WORKSPACE"
			actions={
				<Button variant="outline" className="text-xs font-black uppercase tracking-widest">
					Restaurar Base
				</Button>
			}
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

			<SettingsFooterActions />
		</SettingsShell>
	);
};
