import {
	Building2,
	Calendar,
	DollarSign,
	Percent,
	ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn, n } from "@/lib/utils";
import type {
	InputGroupProps,
	LoanCalculationResult,
	LoanInputCardProps,
	PeruLoanScenario,
} from "../CompareLoansView.types";

const InputGroup = ({
	label,
	value,
	icon,
	step = "1",
	onChange,
}: InputGroupProps) => (
	<div className="space-y-2">
		<label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
			{icon} {label}
		</label>
		<input
			type="number"
			step={step}
			value={value}
			onChange={(e) => onChange(Number(e.target.value))}
			className="w-full bg-muted/30 border border-border rounded-xl px-4 h-11 text-sm font-black font-mono outline-none focus:border-foreground/20 shadow-inner"
		/>
	</div>
);

export const LoanInputCard = ({
	label,
	scenario,
	results,
	setScenario,
	highlight,
}: LoanInputCardProps) => (
	<Card
		className={cn(
			"transition-[background-color,border-color,box-shadow,transform] duration-200",
			highlight ? "border-foreground/30 shadow-xl" : "border-border/50",
		)}
	>
		<CardHeader className="p-8 pb-4">
			<div className="flex justify-between items-start">
				<span className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">
					{label}
				</span>
				<div className="text-right">
					<p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
						Cuota Total
					</p>
					<p className="text-2xl font-black font-mono tracking-tighter text-foreground tabular-nums">
						{n(results.cuotaTotalMensual)}
					</p>
				</div>
			</div>
			<input
				aria-label="Nombre del banco"
				value={scenario.bankName}
				onChange={(e) =>
					setScenario({ ...scenario, bankName: e.target.value.toUpperCase() })
				}
				className="bg-transparent border-none p-0 text-xl font-black text-foreground focus:ring-0 w-full uppercase tracking-tighter mt-4"
			/>
		</CardHeader>
		<CardContent className="p-8 pt-4 space-y-8">
			<div className="grid grid-cols-2 gap-8">
				<InputGroup
					label="Capital"
					value={scenario.amount}
					icon={<DollarSign size={12} />}
					onChange={(v) => setScenario({ ...scenario, amount: v })}
				/>
				<div className="space-y-2">
					<label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
						<Calendar size={12} /> Plazo
					</label>
					<select
						value={scenario.termYears}
						onChange={(e) =>
							setScenario({ ...scenario, termYears: Number(e.target.value) })
						}
						className="w-full bg-muted/30 border border-border rounded-xl px-4 h-11 text-xs font-black uppercase outline-none focus:border-foreground/20 appearance-none"
					>
						{[5, 10, 15, 20, 25, 30].map((y) => (
							<option key={y} value={y}>
								{y} Años
							</option>
						))}
					</select>
				</div>
			</div>
			<div className="grid grid-cols-3 gap-6">
				<InputGroup
					label="TEA %"
					value={scenario.tea}
					step="0.1"
					icon={<Percent size={12} />}
					onChange={(v) => setScenario({ ...scenario, tea: v })}
				/>
				<InputGroup
					label="Desgr. %"
					value={scenario.desgravamenRate}
					step="0.001"
					icon={<ShieldCheck size={12} />}
					onChange={(v) => setScenario({ ...scenario, desgravamenRate: v })}
				/>
				<InputGroup
					label="Riesgo %"
					value={scenario.riskInsuranceRate}
					step="0.001"
					icon={<Building2 size={12} />}
					onChange={(v) => setScenario({ ...scenario, riskInsuranceRate: v })}
				/>
			</div>
			<div className="pt-6 border-t border-border/50 flex justify-between font-mono text-xs font-bold text-muted-foreground uppercase tracking-widest">
				<span>Cuota Base: {n(results.cuotaBase)}</span>
				<span>
					Seguros: {n(results.desgravamenFirstMonth + results.riskInsurance)}
				</span>
			</div>
		</CardContent>
	</Card>
);
