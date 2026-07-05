import { cn } from "@/lib/utils";

export interface RadioGroupProps {
	value: string;
	options: readonly { readonly value: string; readonly label: string }[];
	onChange: (v: string) => void;
}

export function RadioGroup({ value, options, onChange }: RadioGroupProps) {
	return (
		<div className="flex overflow-hidden rounded-lg border border-[var(--border-subtle)]">
			{options.map((opt, i) => (
				<button
					key={opt.value}
					type="button"
					onClick={() => onChange(opt.value)}
					className={cn(
						"flex-1 px-3 py-1.5 text-2xs font-medium transition-all",
						i > 0 && "border-l border-[var(--border-subtle)]",
						value === opt.value
							? "bg-[var(--surface-3)] text-[var(--text-primary)]"
							: "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
					)}
				>
					{opt.label}
				</button>
			))}
		</div>
	);
}
