import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { FIELD_INPUT, FIELD_LABEL } from "../create-invoice/invoice-field";

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
		<div className="grid gap-4 sm:grid-cols-2">
			<div>
				<Label htmlFor="edit-invoice-series" className={FIELD_LABEL}>
					Serie
				</Label>
				<NativeSelect
					id="edit-invoice-series"
					value={series}
					onChange={(e) => setSeries(e.target.value)}
				>
					<option value="F001">F001 · Factura</option>
					<option value="B001">B001 · Boleta</option>
				</NativeSelect>
			</div>
			<div>
				<Label htmlFor="edit-invoice-currency" className={FIELD_LABEL}>
					Moneda
				</Label>
				<NativeSelect
					id="edit-invoice-currency"
					value={currency}
					onChange={(e) => setCurrency(e.target.value as "PEN" | "USD")}
				>
					<option value="PEN">PEN · Soles</option>
					<option value="USD">USD · Dólares</option>
				</NativeSelect>
			</div>
			<div>
				<Label htmlFor="edit-invoice-issue" className={FIELD_LABEL}>
					Fecha de emisión
				</Label>
				<Input
					id="edit-invoice-issue"
					type="date"
					value={issueDate}
					onChange={(e) => setIssueDate(e.target.value)}
					className={FIELD_INPUT}
				/>
			</div>
			<div>
				<Label htmlFor="edit-invoice-due" className={FIELD_LABEL}>
					Fecha de vencimiento
				</Label>
				<Input
					id="edit-invoice-due"
					type="date"
					value={dueDate}
					onChange={(e) => setDueDate(e.target.value)}
					className={FIELD_INPUT}
				/>
			</div>
		</div>
	);
};
