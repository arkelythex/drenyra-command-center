// --- Types ---

export interface PeruLoanScenario {
	id: string;
	bankName: string;
	amount: number;
	propertyValue: number;
	tea: number;
	termYears: number;
	desgravamenRate: number;
	riskInsuranceRate: number;
	currency: "PEN" | "USD";
}

export interface LoanCalculationResult {
	cuotaBase: number;
	desgravamenFirstMonth: number;
	riskInsurance: number;
	cuotaTotalMensual: number;
	totalIntereses: number;
}

export interface LoanInputCardProps {
	label: string;
	scenario: PeruLoanScenario;
	results: LoanCalculationResult;
	setScenario: React.Dispatch<React.SetStateAction<PeruLoanScenario>>;
	highlight?: boolean;
}

export interface InputGroupProps {
	label: string;
	value: number;
	icon: React.ReactNode;
	step?: string;
	onChange: (value: number) => void;
}
