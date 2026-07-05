/**
 * Tooltip Component
 *
 * Floating overlay for contextual information on hover.
 * Built on Radix UI primitives for accessibility.
 *
 * Supports both compound-piece usage and the legacy convenience wrapper.
 *
 * @example
 * ```tsx
 * <Tooltip content="Save document">
 *   <Button icon={SaveIcon}>Save</Button>
 * </Tooltip>
 * ```
 */

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
	type ComponentPropsWithoutRef,
	type ElementRef,
	forwardRef,
	type ReactNode,
} from "react";
import { cn } from "../lib/utils";

export interface TooltipProps {
	/** Content to display in the tooltip */
	content: ReactNode;
	/** Trigger element */
	children: ReactNode;
	/** Preferred alignment */
	align?: "start" | "center" | "end";
	/** Preferred side */
	side?: "top" | "right" | "bottom" | "left";
	/** Delay before showing */
	delayDuration?: number;
}

export type TooltipProviderProps = ComponentPropsWithoutRef<
	typeof TooltipPrimitive.Provider
>;

export type TooltipRootProps = ComponentPropsWithoutRef<
	typeof TooltipPrimitive.Root
>;

export type TooltipTriggerProps = ComponentPropsWithoutRef<
	typeof TooltipPrimitive.Trigger
>;

export interface TooltipContentProps
	extends ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
	className?: string;
}

/**
 * Tooltip provider - wrap at root level for tooltips to work.
 *
 * @example
 * ```tsx
 * <TooltipProvider>
 *   <App />
 * </TooltipProvider>
 * ```
 */
export function TooltipProvider({
	children,
	delayDuration = 300,
	...props
}: TooltipProviderProps) {
	return (
		<TooltipPrimitive.Provider delayDuration={delayDuration} {...props}>
			{children}
		</TooltipPrimitive.Provider>
	);
}

export const TooltipRoot = TooltipPrimitive.Root;

export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = forwardRef<
	ElementRef<typeof TooltipPrimitive.Content>,
	TooltipContentProps
>(function TooltipContent(
	{ className, sideOffset = 4, children, ...props },
	ref,
) {
	return (
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Content
				ref={ref}
				sideOffset={sideOffset}
				className={cn(
					"z-50 overflow-hidden rounded-[var(--radius-md)]",
					"bg-[var(--color-surface-2)]",
					"border border-[var(--color-border)]",
					"px-3 py-1.5",
					"text-xs text-[var(--color-text-primary)]",
					"shadow-[var(--shadow-lg)]",
					"animate-in fade-in-0 zoom-in-95",
					"data-[state=closed]:animate-out fade-out-0 zoom-out-95",
					"data-[side=bottom]:slide-in-from-top-2",
					"data-[side=left]:slide-in-from-right-2",
					"data-[side=right]:slide-in-from-left-2",
					"data-[side=top]:slide-in-from-bottom-2",
					className,
				)}
				{...props}
			>
				{children}
				<TooltipPrimitive.Arrow className="fill-[var(--color-surface-2)]" />
			</TooltipPrimitive.Content>
		</TooltipPrimitive.Portal>
	);
});

/**
 * Tooltip wrapper with ARKELYTHEX styling.
 * Uses Radix UI primitive for accessibility.
 */
export function Tooltip({
	content,
	children,
	align = "center",
	side = "top",
	delayDuration = 300,
}: TooltipProps) {
	return (
		<TooltipRoot delayDuration={delayDuration}>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent side={side} align={align}>
				{content}
			</TooltipContent>
		</TooltipRoot>
	);
}
