export type TaxTabId = "liquidation" | "closure";

export function isTaxTabId(value: string): value is TaxTabId {
	return value === "liquidation" || value === "closure";
}

export interface TaxStatProps {
	label: string;
	value: string;
	highlight?: boolean;
	delay?: number;
}

export interface TaxRowProps {
	label: string;
	value: number;
	isNegative?: boolean;
	code: string;
}

export interface StepItemProps {
	label: string;
	done: boolean;
}

export interface TaxLiquidationHeaderProps {
	period: string;
	onMenuClick: () => void;
}

export interface TaxLiquidationTableProps {
	debito: number;
	credito: number;
	totalImpuestos: number;
}

export interface TaxLiquidationSummaryProps {
	igvPagar: number;
	rentaPagar: number;
	totalImpuestos: number;
}
