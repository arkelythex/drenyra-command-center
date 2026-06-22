import type { ComponentProps } from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "../lib/utils";

/** Inline ghost button style for calendar navigation and day buttons */
const ghostButtonClasses =
	"inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-sm)] text-xs font-medium transition-colors duration-150 " +
	"h-[var(--n-row)] w-[var(--n-row)] bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text-primary)] " +
	"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-1)]";

export type CalendarProps = ComponentProps<typeof DayPicker>;

function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	...props
}: CalendarProps) {
	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={cn("p-[var(--n-pad-md)]", className)}
			classNames={{
				months: "flex flex-col sm:flex-row gap-[var(--n-gap-md)]",
				month: "flex flex-col gap-[var(--n-gap-md)]",
				month_caption: "flex justify-center pt-1 relative items-center",
				caption_label: "text-sm font-medium text-[var(--color-text-primary)]",
				nav: "flex items-center gap-1",
				button_previous: cn(ghostButtonClasses, "absolute left-1 h-7 w-7"),
				button_next: cn(ghostButtonClasses, "absolute right-1 h-7 w-7"),
				month_grid: "w-full border-collapse space-y-1",
				weekdays: "hidden",
				weekday:
					"text-[var(--color-text-muted)] w-9 text-xs font-normal text-center hidden",
				week: "flex w-full mt-[var(--n-gap-sm)] justify-between",
				day: cn(
					"relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
					"[&:has([aria-selected])]:bg-[var(--color-surface-3)] [&:has([aria-selected].day-range-end)]:rounded-r-[var(--radius-md)]",
					"[&:has([aria-selected].day-range-start)]:rounded-l-[var(--radius-md)]",
				),
				day_button: cn(
					ghostButtonClasses,
					"h-9 w-9 p-0 font-normal aria-selected:opacity-100",
				),
				range_end: "day-range-end",
				range_start: "day-range-start",
				selected:
					"bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)] hover:text-white focus:bg-[var(--color-primary)] focus:text-white",
				today: "bg-[var(--color-surface-3)] text-[var(--color-text-primary)]",
				outside:
					"day-outside text-[var(--color-text-muted)] opacity-50 aria-selected:bg-[var(--color-surface-3)]/50 aria-selected:text-[var(--color-text-muted)] aria-selected:opacity-30",
				disabled: "text-[var(--color-text-muted)] opacity-50",
				range_middle:
					"aria-selected:bg-[var(--color-surface-3)] aria-selected:text-[var(--color-text-primary)]",
				hidden: "invisible",
				...classNames,
			}}
			{...props}
		/>
	);
}
Calendar.displayName = "Calendar";

export { Calendar };
