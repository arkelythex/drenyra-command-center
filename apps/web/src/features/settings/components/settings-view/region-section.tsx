import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SettingsRow, SettingsSection } from "../SettingsPrimitives";

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
			title="Región y formatos"
			description="Aplica preferencias regionales que afectan reportes, moneda y presentación de fechas."
		>
			<SettingsRow
				title="Idioma"
				description="Idioma de la interfaz y de las respuestas del asistente."
				action={
					<Select value={language} onValueChange={onLanguageChange}>
						<SelectTrigger
							aria-label="Idioma"
							className="h-11 min-w-[160px] border-[var(--color-stroke-2)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] hover:border-[var(--color-stroke-3)] focus:ring-[var(--color-info)]"
						>
							<SelectValue placeholder="Seleccionar idioma" />
						</SelectTrigger>
						<SelectContent className="border-[var(--color-stroke-1)] bg-[var(--color-surface-2)]">
							<SelectItem
								value="es"
								className="text-[var(--color-text-primary)] hover:bg-[var(--color-surface-3)]"
							>
								Español
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
						<SelectTrigger
							aria-label="Zona horaria"
							className="h-11 min-w-[180px] border-[var(--color-stroke-2)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] hover:border-[var(--color-stroke-3)] focus:ring-[var(--color-info)]"
						>
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
				description="Moneda de referencia para paneles e indicadores."
				action={
					<fieldset className="grid grid-cols-3 gap-2">
						<legend className="sr-only">Moneda por defecto</legend>
						{CURRENCIES.map((item) => (
							<label
								key={item.value}
								className="flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg border border-border px-3 text-sm font-medium tabular-nums text-muted-foreground transition-colors hover:bg-muted hover:text-foreground has-[:checked]:border-ring has-[:checked]:bg-muted has-[:checked]:text-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/40"
							>
								<input
									type="radio"
									name="currency"
									value={item.value}
									checked={currency === item.value}
									onChange={() => onCurrencyChange(item.value)}
									className="sr-only"
								/>
								{item.label}
							</label>
						))}
					</fieldset>
				}
			/>
		</SettingsSection>
	);
}
