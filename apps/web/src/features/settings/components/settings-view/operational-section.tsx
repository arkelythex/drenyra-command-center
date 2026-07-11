import {
	SettingSwitch,
	SettingsRow,
	SettingsSection,
} from "../SettingsPrimitives";

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
			description="Controles rápidos para estandarizar el flujo de trabajo del equipo contable."
		>
			<SettingsRow
				title="Cierre mensual automático"
				description="Sugiere y marca el cierre del período cuando no hay movimientos pendientes."
				action={
					<div className="flex justify-end">
						<SettingSwitch
							checked={autoClosePeriod}
							onCheckedChange={onAutoCloseChange}
							label="Cierre mensual automático"
						/>
					</div>
				}
			/>

			<SettingsRow
				title="Montos en letras"
				description="Muestra la conversión automática de importes en letras dentro de plantillas de comprobantes."
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
