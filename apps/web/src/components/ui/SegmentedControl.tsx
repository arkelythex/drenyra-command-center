import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string = string> {
	readonly id: T;
	readonly label: string;
}

export interface SegmentedControlProps<T extends string> {
	options: readonly SegmentedOption<T>[];
	value: T;
	onChange: (id: T) => void;
	/** Accessible name of the group, e.g. "Vistas". */
	label: string;
	className?: string;
}

/**
 * Atom: switches between views of the same content. Exposed as a tablist;
 * the selected segment is neutral (surface + weight), not an accent fill.
 */
export function SegmentedControl<T extends string>({
	options,
	value,
	onChange,
	label,
	className,
}: SegmentedControlProps<T>) {
	return (
		<div
			role="tablist"
			aria-label={label}
			className={cn(
				"flex gap-1 rounded-lg border border-border bg-muted p-1",
				className,
			)}
		>
			{options.map((option) => {
				const selected = option.id === value;
				return (
					<button
						key={option.id}
						type="button"
						role="tab"
						aria-selected={selected}
						onClick={() => onChange(option.id)}
						className={cn(
							"h-9 flex-1 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
							selected
								? "bg-background font-medium text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}
