import { useState } from "react";
import { Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHaptics } from "@/hooks/useHaptics";

export interface TransactionFiltersValue {
	startDate?: string;
	endDate?: string;
}

interface TransactionFiltersProps {
	value: TransactionFiltersValue;
	onChange: (value: TransactionFiltersValue) => void;
	onApply: () => void;
}

export const TransactionFilters = ({
	value,
	onChange,
	onApply,
}: TransactionFiltersProps) => {
	const { trigger } = useHaptics();
	const [local, setLocal] = useState<TransactionFiltersValue>(value);

	const dirty =
		local.startDate !== value.startDate || local.endDate !== value.endDate;

	const apply = () => {
		trigger("light");
		onChange(local);
		onApply();
	};

	return (
		<div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
			<div className="flex items-center gap-2 flex-1">
				<Calendar size={14} className="text-[var(--text-tertiary)]" />
				<Input
					type="date"
					value={local.startDate ?? ""}
					onChange={(e) =>
						setLocal((s) => ({ ...s, startDate: e.target.value || undefined }))
					}
					className="ui-search-input h-10 rounded-xl border-[var(--border-subtle)] text-xs font-bold uppercase"
				/>
				<span className="text-[var(--text-tertiary)]/40 text-xs font-bold">
					—
				</span>
				<Input
					type="date"
					value={local.endDate ?? ""}
					onChange={(e) =>
						setLocal((s) => ({ ...s, endDate: e.target.value || undefined }))
					}
					className="ui-search-input h-10 rounded-xl border-[var(--border-subtle)] text-xs font-bold uppercase"
				/>
			</div>

			<Button
				variant="outline"
				size="sm"
				onClick={apply}
				disabled={!dirty}
				className="h-10 rounded-xl border-[var(--border-subtle)] bg-[var(--surface-2)] px-5 text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
			>
				Aplicar
			</Button>
		</div>
	);
};
