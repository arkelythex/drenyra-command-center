import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SettingsRow, SettingsSection } from "../SettingsPrimitives";
import { cn } from "@/lib/utils";

interface RegionSettingsSectionProps {
	language: string;
	timezone: string;
	currency: string;
	onLanguageChange: (value: string) => void;
	onTimezoneChange: (value: string) => void;
	onCurrencyChange: (value: string) => void;
}

const CURRENCIES = [
	{ value: "PEN", label: "S/" },
	{ value: "USD", label: "$" },
	{ value: "EUR", label: "EUR" },
];

export function RegionSettingsSection({
	language,
	timezone,
	currency,
	onLanguageChange,
	onTimezoneChange,
	onCurrencyChange,
}: RegionSettingsSectionProps) {
	return (
		<SettingsSection
			title="Region y Formatos"
			description="Aplica preferencias regionales que afectan reportes, moneda y presentacion de fechas."
		>
			<SettingsRow
				title="Idioma"
				description="Idioma principal para UI y mensajes del asistente."
				action={
					<Select value={language} onValueChange={onLanguageChange}>
						<SelectTrigger className="h-11 min-w-[160px] border-[var(--color-stroke-2)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] hover:border-[var(--color-stroke-3)] focus:ring-[var(--color-info)]">
							<SelectValue placeholder="Seleccionar idioma" />
						</SelectTrigger>
						<SelectContent className="border-[var(--color-stroke-1)] bg-[var(--color-surface-2)]">
							<SelectItem
								value="es"
								className="text-[var(--color-text-primary)] hover:bg-[var(--color-surface-3)]"
							>
								Espanol
							</SelectItem>
							<SelectItem
								value="en"
								className="text-[var(--color-text-primary)] hover:bg-[var(--color-surface-3)]"
							>
								English
							</SelectItem>
						</SelectContent>
					</Select>
				}
			/>

			<SettingsRow
				title="Zona horaria"
				description="Usada para cierres, vencimientos y sellos de tiempo en reportes."
				action={
					<Select value={timezone} onValueChange={onTimezoneChange}>
						<SelectTrigger className="h-11 min-w-[180px] border-[var(--color-stroke-2)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] hover:border-[var(--color-stroke-3)] focus:ring-[var(--color-info)]">
							<SelectValue placeholder="Seleccionar zona horaria" />
						</SelectTrigger>
						<SelectContent className="border-[var(--color-stroke-1)] bg-[var(--color-surface-2)]">
							<SelectItem
								value="America/Lima"
								className="text-[var(--color-text-primary)] hover:bg-[var(--color-surface-3)]"
							>
								Lima (GMT-5)
							</SelectItem>
							<SelectItem
								value="America/Bogota"
								className="text-[var(--color-text-primary)] hover:bg-[var(--color-surface-3)]"
							>
								Bogota (GMT-5)
							</SelectItem>
							<SelectItem
								value="America/Mexico_City"
								className="text-[var(--color-text-primary)] hover:bg-[var(--color-surface-3)]"
							>
								CDMX (GMT-6)
							</SelectItem>
							<SelectItem
								value="Europe/Madrid"
								className="text-[var(--color-text-primary)] hover:bg-[var(--color-surface-3)]"
							>
								Madrid (GMT+1)
							</SelectItem>
						</SelectContent>
					</Select>
				}
			/>

			<SettingsRow
				title="Moneda por defecto"
				description="Moneda de referencia para paneles ejecutivos y KPIs globales."
				action={
					<div className="grid grid-cols-3 gap-2">
						{CURRENCIES.map((item) => (
							<button
								key={item.value}
								type="button"
								onClick={() => onCurrencyChange(item.value)}
								className={cn(
									"rounded-xl border px-3 py-2 text-sm font-black transition-all duration-150",
									currency === item.value
										? "border-[var(--color-info)]/40 bg-[var(--color-info)]/10 text-[var(--color-info)] shadow-[0_0_8px_var(--color-info)]/30"
										: "border-[var(--color-stroke-2)] bg-[var(--color-surface-1)]/50 text-[var(--color-text-muted)] hover:border-[var(--color-stroke-3)] hover:text-[var(--color-text-secondary)]",
								)}
							>
								{item.label}
							</button>
						))}
					</div>
				}
			/>
		</SettingsSection>
	);
}
