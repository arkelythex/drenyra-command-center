import { SettingSwitch, SettingsRow, SettingsSection } from "../SettingsPrimitives";

interface OperationalSettingsSectionProps {
	autoClosePeriod: boolean;
	showAmountsInWords: boolean;
	onAutoCloseChange: (value: boolean) => void;
	onShowAmountsInWordsChange: (value: boolean) => void;
}

export function OperationalSettingsSection({
	autoClosePeriod,
	showAmountsInWords,
	onAutoCloseChange,
	onShowAmountsInWordsChange,
}: OperationalSettingsSectionProps) {
	return (
		<SettingsSection
			title="Preferencias Operativas"
			description="Controles rapidos para estandarizar flujo de trabajo del equipo contable."
		>
			<SettingsRow
				title="Cierre mensual automatico"
				description="Sugiere y marca cierre de periodo cuando no hay movimientos pendientes."
				action={
					<div className="flex justify-end">
						<SettingSwitch
							checked={autoClosePeriod}
							onCheckedChange={onAutoCloseChange}
							label="Cierre mensual automatico"
						/>
					</div>
				}
			/>

			<SettingsRow
				title="Montos en letras"
				description="Muestra conversion automatica de importes en letras dentro de plantillas de comprobantes."
				action={
					<div className="flex justify-end">
						<SettingSwitch
							checked={showAmountsInWords}
							onCheckedChange={onShowAmountsInWordsChange}
							label="Montos en letras"
						/>
					</div>
				}
			/>
		</SettingsSection>
	);
}
