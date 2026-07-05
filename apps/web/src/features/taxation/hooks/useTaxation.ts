import { useMemo, useState } from "react";

export interface TaxSummary {
	period: string;
	salesIgv: number;
	purchasesIgv: number;
	rentaBase: number;
	rentaRate: number;
	carryForward: number;
	retentions: number;
}

const MOCK_TAX: TaxSummary = {
	period: "Enero 2025",
	salesIgv: 45200.5,
	purchasesIgv: 28400.2,
	rentaBase: 251113.8,
	rentaRate: 1.0,
	carryForward: 1200.0,
	retentions: 450.0,
};

export const useTaxation = () => {
	const [data] = useState<TaxSummary>(MOCK_TAX);

	const calculations = useMemo(() => {
		const igvPagar = Math.max(
			0,
			data.salesIgv - data.purchasesIgv - data.carryForward - data.retentions,
		);
		const rentaPagar = data.rentaBase * (data.rentaRate / 100);
		const totalImpuestos = igvPagar + rentaPagar;

		return {
			igvPagar,
			rentaPagar,
			totalImpuestos,
			igvDetails: {
				debito: data.salesIgv,
				credito: -data.purchasesIgv,
				carryForward: -data.carryForward,
				retentions: -data.retentions,
			},
		};
	}, [data]);

	return {
		data,
		calculations,
	};
};
