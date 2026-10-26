import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { SettingsSection } from "../SettingsPrimitives";

interface CompanySettingsSectionProps {
	companyName: string;
	companyRuc: string;
	onCompanyNameChange: (value: string) => void;
	onCompanyRucChange: (value: string) => void;
}

const RUC_PATTERN = /^\d{11}$/;

/**
 * Text fields edit locally and save on blur: settings auto-save, so saving on
 * every keystroke would send one request per key and persist half-typed values.
 */
export function CompanySettingsSection({
	companyName,
	companyRuc,
	onCompanyNameChange,
	onCompanyRucChange,
}: CompanySettingsSectionProps) {
	const [name, setName] = useState(companyName);
	const [ruc, setRuc] = useState(companyRuc);
	const [rucError, setRucError] = useState<string | null>(null);

	// Server values win when they change underneath (e.g. after refetch).
	useEffect(() => setName(companyName), [companyName]);
	useEffect(() => setRuc(companyRuc), [companyRuc]);

	const commitName = () => {
		const value = name.trim();
		if (value !== companyName) onCompanyNameChange(value);
	};

	const commitRuc = () => {
		if (ruc === companyRuc) return setRucError(null);
		if (!RUC_PATTERN.test(ruc)) {
			return setRucError("El RUC debe tener 11 dígitos.");
		}
		setRucError(null);
		onCompanyRucChange(ruc);
	};

	return (
		<SettingsSection
			title="Empresa"
			description="Datos institucionales usados en documentos tributarios y reportes oficiales."
		>
			<div className="grid gap-4 p-4 md:grid-cols-2">
				<div>
					<label
						htmlFor="company-name"
						className="mb-2 block text-sm font-medium text-foreground"
					>
						Razón social
					</label>
					<Input
						id="company-name"
						value={name}
						onChange={(event) => setName(event.target.value)}
						onBlur={commitName}
						autoComplete="organization"
						placeholder="Ej. Inversiones Andinas S.A.C."
						className="h-11 border-input bg-background"
					/>
				</div>

				<div>
					<label
						htmlFor="company-ruc"
						className="mb-2 block text-sm font-medium text-foreground"
					>
						RUC
					</label>
					<Input
						id="company-ruc"
						value={ruc}
						onChange={(event) => setRuc(event.target.value.replace(/\D/g, ""))}
						onBlur={commitRuc}
						inputMode="numeric"
						placeholder="20123456789"
						maxLength={11}
						aria-invalid={rucError ? true : undefined}
						aria-describedby="company-ruc-hint"
						className="h-11 border-input bg-background font-mono tabular-nums aria-invalid:border-destructive"
					/>
					<p
						id="company-ruc-hint"
						className={
							rucError
								? "mt-1.5 text-xs text-destructive"
								: "mt-1.5 text-xs text-muted-foreground"
						}
					>
						{rucError ?? "11 dígitos, tal como figura en SUNAT."}
					</p>
				</div>
			</div>
		</SettingsSection>
	);
}
