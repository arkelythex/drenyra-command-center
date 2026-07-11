/**
 * Select Component
 *
 * Dropdown select using Radix UI primitive for accessibility.
 * Provides accessible select menus with ARKELYTHEX styling.
 *
 * @example
 * ```tsx
 * <Select onValueChange={(value) => setStatus(value)}>
 *   <SelectTrigger placeholder="Select status">
 *     <SelectValue />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="active">Active</SelectItem>
 *     <SelectItem value="inactive">Inactive</SelectItem>
 *   </SelectContent>
 * </Select>
 * ```
 */

import * as SelectPrimitive from "@radix-ui/react-select";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

/**
 * Select root - wraps the entire select structure
 */
export function Select({
	children,
	value,
	onValueChange,
	defaultValue,
	open,
	onOpenChange,
	name,
	disabled,
	required,
}: {
	children: ReactNode;
	/** Controlled selected value */
	value?: string;
	/** Callback when value changes */
	onValueChange?: (value: string) => void;
	/** Default value for uncontrolled mode */
	defaultValue?: string;
	/** Controlled open state */
	open?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (open: boolean) => void;
	/** Form name attribute */
	name?: string;
	/** Disable the select */
	disabled?: boolean;
	/** Mark as required */
	required?: boolean;
}) {
	return (
		<SelectPrimitive.Root
			value={value}
			onValueChange={onValueChange}
			defaultValue={defaultValue}
			open={open}
			onOpenChange={onOpenChange}
			name={name}
			disabled={disabled}
			required={required}
		>
			{children}
		</SelectPrimitive.Root>
	);
}

export interface SelectTriggerProps {
	/** Trigger content */
	children?: ReactNode;
	/** Placeholder text when no value selected */
	placeholder?: string;
	/** Additional CSS classes */
	className?: string;
	/** Disable the select */
	disabled?: boolean;
}

/**
 * Select trigger - button that opens the dropdown
 */
export function SelectTrigger({
	children,
	placeholder,
	className,
	disabled,
}: SelectTriggerProps) {
	return (
		<SelectPrimitive.Trigger
			className={cn(
				"flex h-density-row w-full items-center justify-between",
				"rounded-[var(--radius-md)]",
				"bg-[var(--color-surface-2)]",
				"text-[var(--color-text-primary)]",
				"border border-[var(--color-border)]",
				"px-density-md text-sm",
				"transition-colors duration-200",
				"hover:border-[var(--color-primary)]",
				"focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]",
				"data-[placeholder]:text-[var(--color-text-muted)]",
				"disabled:pointer-events-none disabled:opacity-50",
				className,
			)}
			disabled={disabled}
		>
			{children || <SelectPrimitive.Value placeholder={placeholder} />}
			<SelectPrimitive.Icon asChild>
				{/* Chevron down icon - simple SVG */}
				<svg
					width="12"
					height="12"
					viewBox="0 0 12 12"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className="opacity-50"
					aria-hidden="true"
				>
					<path
						d="M3 4.5L6 7.5L9 4.5"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</SelectPrimitive.Icon>
		</SelectPrimitive.Trigger>
	);
}

/**
 * Select value - displays the selected value
 */
export function SelectValue({ placeholder }: { placeholder?: string }) {
	return <SelectPrimitive.Value placeholder={placeholder} />;
}

export interface SelectContentProps {
	/** Content items */
	children: ReactNode;
	/** Additional CSS classes */
	className?: string;
}

/**
 * Select content - the dropdown items container
 */
export function SelectContent({ children, className }: SelectContentProps) {
	return (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Content
				className={cn(
					"relative z-50",
					"min-w-[8rem] overflow-hidden",
					"rounded-[var(--radius-md)]",
					"bg-[var(--color-surface-2)]",
					"border border-[var(--color-border)]",
					"shadow-[var(--shadow-lg)]",
					"animate-in fade-in-0 zoom-in-95",
					"data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
					"data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
					className,
				)}
			>
				<SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1">
					{/* Chevron up icon */}
					<svg
						width="12"
						height="12"
						viewBox="0 0 12 12"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="opacity-50"
						aria-hidden="true"
					>
						<path
							d="M3 7.5L6 4.5L9 7.5"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</SelectPrimitive.ScrollUpButton>
				<SelectPrimitive.Viewport className="p-1">
					{children}
				</SelectPrimitive.Viewport>
				<SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1">
					{/* Chevron down icon */}
					<svg
						width="12"
						height="12"
						viewBox="0 0 12 12"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="opacity-50"
						aria-hidden="true"
					>
						<path
							d="M3 4.5L6 7.5L9 4.5"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</SelectPrimitive.ScrollDownButton>
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	);
}

export interface SelectItemProps {
	/** Item content */
	children: ReactNode;
	/** Item value */
	value: string;
	/** Disable the item */
	disabled?: boolean;
	/** Additional CSS classes */
	className?: string;
}

/**
 * Select item - individual dropdown option
 */
export function SelectItem({
	children,
	value,
	disabled,
	className,
}: SelectItemProps) {
	return (
		<SelectPrimitive.Item
			className={cn(
				"relative flex cursor-pointer select-none items-center",
				"rounded-[var(--radius-sm)]",
				"py-density-sm pl-8 pr-density-md",
				"text-sm text-[var(--color-text-primary)]",
				"outline-none",
				"transition-colors duration-150",
				"focus:bg-[var(--color-surface-3)]",
				"data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
				className,
			)}
			value={value}
			disabled={disabled}
		>
			<SelectPrimitive.ItemIndicator className="absolute left-2 flex items-center justify-center">
				{/* Check icon */}
				<svg
					width="12"
					height="12"
					viewBox="0 0 12 12"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					<path
						d="M10 3L4.5 8.5L2 6"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</SelectPrimitive.ItemIndicator>
			<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
		</SelectPrimitive.Item>
	);
}

/**
 * Select group - groups related items
 */
export function SelectGroup({ children }: { children: ReactNode }) {
	return <SelectPrimitive.Group>{children}</SelectPrimitive.Group>;
}

/**
 * Select label - labels a group
 */
export function SelectLabel({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<SelectPrimitive.Label
			className={cn(
				"px-density-sm py-density-sm text-xs font-medium uppercase tracking-wide",
				"text-[var(--color-text-muted)]",
				className,
			)}
		>
			{children}
		</SelectPrimitive.Label>
	);
}

/**
 * Select separator - visual divider between groups
 */
export function SelectSeparator({ className }: { className?: string }) {
	return (
		<SelectPrimitive.Separator
			className={cn(
				"-mx-[var(--n-pad-sm)] my-[var(--n-pad-sm)]",
				"h-px bg-[var(--color-border)]",
				className,
			)}
		/>
	);
}

/**
 * Select scroll up button
 */
export function SelectScrollUpButton() {
	return (
		<SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-density-sm">
			<svg
				width="12"
				height="12"
				viewBox="0 0 12 12"
				fill="none"
				className="opacity-50"
				aria-hidden="true"
			>
				<path
					d="M3 7.5L6 4.5L9 7.5"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</SelectPrimitive.ScrollUpButton>
	);
}

/**
 * Select scroll down button
 */
export function SelectScrollDownButton() {
	return (
		<SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-density-sm">
			<svg
				width="12"
				height="12"
				viewBox="0 0 12 12"
				fill="none"
				className="opacity-50"
				aria-hidden="true"
			>
				<path
					d="M3 4.5L6 7.5L9 4.5"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</SelectPrimitive.ScrollDownButton>
	);
}
