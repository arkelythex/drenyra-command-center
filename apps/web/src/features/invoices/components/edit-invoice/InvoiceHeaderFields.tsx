import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";

interface InvoiceHeaderFieldsProps {
	series: string;
	setSeries: (value: string) => void;
	issueDate: string;
	setIssueDate: (value: string) => void;
	dueDate: string;
	setDueDate: (value: string) => void;
	currency: "PEN" | "USD";
	setCurrency: (value: "PEN" | "USD") => void;
}

export const InvoiceHeaderFields = ({
	series,
	setSeries,
	issueDate,
	setIssueDate,
	dueDate,
	setDueDate,
	currency,
	setCurrency,
}: InvoiceHeaderFieldsProps) => {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-3 gap-4">
				<div className="space-y-2">
					<label className="text-label font-black uppercase tracking-widest text-muted-foreground">
						Serie
					</label>
					<select
						value={series}
						onChange={(e) => setSeries(e.target.value)}
						className="w-full h-11 bg-background border border-border rounded-lg px-3 font-mono text-xs text-foreground"
					>
						<option value="F001">F001 - Factura</option>
						<option value="B001">B001 - Boleta</option>
					</select>
				</div>

				<div className="space-y-2">
					<label className="text-label font-black uppercase tracking-widest text-muted-foreground">
						Fecha Emisión *
					</label>
					<div className="relative">
						<Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							type="date"
							value={issueDate}
							onChange={(e) => setIssueDate(e.target.value)}
							className="pl-10 h-11 bg-background border-border font-mono text-xs"
						/>
					</div>
				</div>

				<div className="space-y-2">
					<label className="text-label font-black uppercase tracking-widest text-muted-foreground">
						Fecha Vencimiento *
					</label>
					<div className="relative">
						<Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							type="date"
							value={dueDate}
							onChange={(e) => setDueDate(e.target.value)}
							className="pl-10 h-11 bg-background border-border font-mono text-xs"
						/>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-3 gap-4">
				<div className="space-y-2">
					<label className="text-label font-black uppercase tracking-widest text-muted-foreground">
						Moneda
					</label>
					<select
						value={currency}
						onChange={(e) => setCurrency(e.target.value as "PEN" | "USD")}
						className="w-full h-11 bg-background border border-border rounded-lg px-3 font-mono text-xs text-foreground"
					>
						<option value="PEN">PEN - Soles</option>
						<option value="USD">USD - Dólares</option>
					</select>
				</div>
			</div>
		</div>
	);
};
