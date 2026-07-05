import type {
	CurrencyCode,
	SireDocumentRecord,
} from "../../types/artifact.types";
import { formatCurrency } from "./utils";

interface SireDiffRecordCardProps {
	record?: SireDocumentRecord;
	currency: CurrencyCode;
	draftTotal?: number;
}

export function SireDiffRecordCard({
	record,
	currency,
	draftTotal,
}: SireDiffRecordCardProps) {
	if (!record) {
		if (draftTotal === undefined) {
			return (
				<div className="rounded-lg border border-dashed border-border px-2 py-2 text-2xs uppercase tracking-wider text-muted-foreground">
					Sin registro
				</div>
			);
		}

		return (
			<div className="space-y-1 rounded-lg border border-primary/20 bg-primary/10 px-2 py-2">
				<p className="text-2xs font-black uppercase tracking-wider text-primary">
					Sugerencia IA
				</p>
				<p className="text-label font-black text-primary-foreground">
					{formatCurrency(draftTotal, currency)}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-1 rounded-lg border border-border bg-card/70 px-2 py-2">
			<p className="text-2xs font-black uppercase tracking-wider text-foreground">
				{record.documentType} {record.series}-{record.number}
			</p>
			<p className="text-2xs text-muted-foreground">{record.issueDate}</p>
			<p className="text-label font-black">
				{formatCurrency(record.total, currency)}
			</p>
			{draftTotal !== undefined ? (
				<p className="text-2xs font-semibold text-primary">
					IA: {formatCurrency(draftTotal, currency)}
				</p>
			) : null}
		</div>
	);
}
