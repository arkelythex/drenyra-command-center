export interface SelectProps {
	value: string;
	options: readonly { readonly value: string; readonly label: string }[];
	onChange: (v: string) => void;
	"aria-label"?: string;
}

export function Select({ value, options, onChange, ...props }: SelectProps) {
	return (
		<select
			aria-label={props["aria-label"]}
			value={value}
			onChange={(e) => onChange(e.target.value)}
			className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--color-info)]/50"
		>
			{options.map((opt) => (
				<option key={opt.value} value={opt.value}>
					{opt.label}
				</option>
			))}
		</select>
	);
}
