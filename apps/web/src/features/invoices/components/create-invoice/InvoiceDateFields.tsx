import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FIELD_INPUT, FIELD_LABEL } from "./invoice-field";

interface InvoiceDateFieldsProps {
	issueDate: string;
	dueDate: string;
	onIssueDateChange: (date: string) => void;
	onDueDateChange: (date: string) => void;
}

export function InvoiceDateFields({
	issueDate,
	dueDate,
	onIssueDateChange,
	onDueDateChange,
}: InvoiceDateFieldsProps) {
	return (
		<>
			<div>
				<Label htmlFor="invoice-issue-date" className={FIELD_LABEL}>
					Fecha de emisión
				</Label>
				<Input
					id="invoice-issue-date"
					className={FIELD_INPUT}
					onChange={(event) => onIssueDateChange(event.target.value)}
					type="date"
					value={issueDate}
				/>
			</div>
			<div>
				<Label htmlFor="invoice-due-date" className={FIELD_LABEL}>
					Fecha de vencimiento
				</Label>
				<Input
					id="invoice-due-date"
					className={FIELD_INPUT}
					onChange={(event) => onDueDateChange(event.target.value)}
					type="date"
					value={dueDate}
				/>
			</div>
		</>
	);
}
