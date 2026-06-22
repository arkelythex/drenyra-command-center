import * as SwitchPrimitive from "@radix-ui/react-switch";
import {
	type ComponentPropsWithoutRef,
	type ElementRef,
	forwardRef,
} from "react";
import { cn } from "../lib/utils";

export interface SwitchProps
	extends ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
	label?: string;
	description?: string;
}

const Switch = forwardRef<ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
	({ className, label, description, id, ...props }, ref) => {
		const switchId = id || `switch-${Math.random().toString(36).slice(2, 9)}`;
		return (
			<div className="flex items-center gap-[var(--n-gap-md)]">
				<SwitchPrimitive.Root
					id={switchId}
					ref={ref}
					className={cn(
						"peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
						"bg-[var(--color-surface-3)] transition-colors duration-150",
						"data-[state=checked]:bg-[var(--color-primary)]",
						"focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface-1)]",
						"disabled:cursor-not-allowed disabled:opacity-50",
						className,
					)}
					{...props}
				>
					<SwitchPrimitive.Thumb
						className={cn(
							"pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-150",
							"data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
						)}
					/>
				</SwitchPrimitive.Root>
				{(label || description) && (
					<div className="flex flex-col gap-0.5">
						{label && (
							<label
								htmlFor={switchId}
								className="text-sm font-medium text-[var(--color-text-primary)] cursor-pointer"
							>
								{label}
							</label>
						)}
						{description && (
							<span className="text-xs text-[var(--color-text-muted)]">
								{description}
							</span>
						)}
					</div>
				)}
			</div>
		);
	},
);
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
