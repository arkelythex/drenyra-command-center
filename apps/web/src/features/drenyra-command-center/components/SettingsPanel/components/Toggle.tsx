import { cn } from "@/lib/utils";

export interface ToggleProps {
	value: boolean;
	onChange: (v: boolean) => void;
}

export function Toggle({ value, onChange }: ToggleProps) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={value}
			onClick={() => onChange(!value)}
			className={cn(
				"relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
				value ? "bg-[var(--color-info)]" : "bg-[var(--surface-3)]",
			)}
		>
			<span
				className={cn(
					"inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
					value ? "translate-x-[18px]" : "translate-x-[3px]",
				)}
			/>
		</button>
	);
}
