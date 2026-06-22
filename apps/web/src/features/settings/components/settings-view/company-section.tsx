import { Input } from "@/components/ui/input";
import { SettingsSection } from "../SettingsPrimitives";

interface CompanySettingsSectionProps {
	companyName: string;
	companyRuc: string;
	onCompanyNameChange: (value: string) => void;
	onCompanyRucChange: (value: string) => void;
}

export function CompanySettingsSection({
	companyName,
	companyRuc,
	onCompanyNameChange,
	onCompanyRucChange,
}: CompanySettingsSectionProps) {
	return (
		<SettingsSection
			title="Empresa"
			description="Datos institucionales usados en documentos tributarios y reportes oficiales."
		>
			<div className="grid gap-4 md:grid-cols-2">
				<div>
					<label
						htmlFor="company-name"
						className="mb-2 block text-xs font-black uppercase tracking-[0.13em] text-[var(--color-text-secondary)]"
					>
						Razon social
					</label>
					<Input
						id="company-name"
						value={companyName}
						onChange={(event) => onCompanyNameChange(event.target.value)}
						className="border-[var(--color-stroke-2)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus:border-[var(--color-info)] focus:ring-[var(--color-info)]"
					/>
				</div>

				<div>
					<label
						htmlFor="company-ruc"
						className="mb-2 block text-xs font-black uppercase tracking-[0.13em] text-[var(--color-text-secondary)]"
					>
						RUC
					</label>
					<Input
						id="company-ruc"
						value={companyRuc}
						onChange={(event) => onCompanyRucChange(event.target.value)}
						className="font-mono border-[var(--color-stroke-2)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus:border-[var(--color-info)] focus:ring-[var(--color-info)]"
						maxLength={11}
					/>
				</div>
			</div>
		</SettingsSection>
	);
}
