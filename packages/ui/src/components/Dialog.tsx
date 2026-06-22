/**
 * Dialog Component
 *
 * Modal dialog using Radix UI primitive for accessibility.
 * Provides accessible overlays with ARKELYTHEX styling.
 *
 * @example
 * ```tsx
 * <Dialog>
 *   <DialogTrigger asChild>
 *     <Button>Open Modal</Button>
 *   </DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Confirm Action</DialogTitle>
 *       <DialogDescription>Are you sure you want to proceed?</DialogDescription>
 *     </DialogHeader>
 *     <DialogFooter>
 *       <DialogClose asChild>
 *         <Button variant="secondary">Cancel</Button>
 *       </DialogClose>
 *       <Button>Confirm</Button>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 * ```
 */

import type { ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../lib/utils";

export interface DialogProps {
	/** Dialog children */
	children: ReactNode;
	/** Controlled open state */
	open?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (open: boolean) => void;
}

/**
 * Dialog root - wraps the entire dialog structure
 */
export function Dialog({ children, open, onOpenChange }: DialogProps) {
	return (
		<DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
			{children}
		</DialogPrimitive.Root>
	);
}

/**
 * Dialog trigger - element that opens the dialog
 */
export function DialogTrigger({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
	return (
		<DialogPrimitive.Trigger asChild={asChild}>
			{children}
		</DialogPrimitive.Trigger>
	);
}

export interface DialogContentProps {
	/** Dialog content */
	children: ReactNode;
	/** Additional CSS classes */
	className?: string;
}

/**
 * Dialog content - the modal overlay and content area
 */
export function DialogContent({ children, className }: DialogContentProps) {
	return (
		<DialogPrimitive.Portal>
			<DialogPrimitive.Overlay
				className={cn(
					"fixed inset-0 z-50",
					"bg-black/60 backdrop-blur-sm",
					"data-[state=open]:animate-in data-[state=closed]:animate-out",
					"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
				)}
			/>
			<DialogPrimitive.Content
				className={cn(
					"fixed left-1/2 top-1/2 z-50",
					"-translate-x-1/2 -translate-y-1/2",
					"w-full max-w-lg",
					"rounded-[var(--radius-lg)]",
					"bg-[var(--color-surface-2)]",
					"border border-[var(--color-border)]",
					"shadow-[var(--shadow-xl)]",
					"p-6",
					"data-[state=open]:animate-in data-[state=closed]:animate-out",
					"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
					"data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
					"data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2",
					"data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]",
					"duration-200",
					className,
				)}
			>
				{children}
				<DialogPrimitive.Close
					className={cn(
						"absolute right-4 top-4",
						"rounded-[var(--radius-sm)]",
						"p-1",
						"text-[var(--color-text-secondary)]",
						"hover:text-[var(--color-text-primary)]",
						"hover:bg-[var(--color-surface-3)]",
						"transition-colors duration-200",
						"focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]",
					)}
				>
					{/* X icon SVG - simple, no external dependency */}
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						aria-hidden="true"
					>
						<path
							d="M12 4L4 12M4 4L12 12"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					<span className="sr-only">Close</span>
				</DialogPrimitive.Close>
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	);
}

export interface DialogHeaderProps {
	/** Header content */
	children: ReactNode;
	/** Additional CSS classes */
	className?: string;
}

/**
 * Dialog header - contains title and description
 */
export function DialogHeader({ children, className }: DialogHeaderProps) {
	return (
		<div className={cn("flex flex-col gap-1.5 mb-4", className)}>
			{children}
		</div>
	);
}

export interface DialogTitleProps {
	/** Title content */
	children: ReactNode;
	/** Additional CSS classes */
	className?: string;
}

/**
 * Dialog title - accessible heading for the dialog
 */
export function DialogTitle({ children, className }: DialogTitleProps) {
	return (
		<DialogPrimitive.Title
			className={cn(
				"text-lg font-semibold text-[var(--color-text-primary)]",
				className,
			)}
		>
			{children}
		</DialogPrimitive.Title>
	);
}

export interface DialogDescriptionProps {
	/** Description content */
	children: ReactNode;
	/** Additional CSS classes */
	className?: string;
}

/**
 * Dialog description - accessible description for the dialog
 */
export function DialogDescription({ children, className }: DialogDescriptionProps) {
	return (
		<DialogPrimitive.Description
			className={cn(
				"text-sm text-[var(--color-text-secondary)]",
				className,
			)}
		>
			{children}
		</DialogPrimitive.Description>
	);
}

export interface DialogFooterProps {
	/** Footer content */
	children: ReactNode;
	/** Additional CSS classes */
	className?: string;
}

/**
 * Dialog footer - contains action buttons
 */
export function DialogFooter({ children, className }: DialogFooterProps) {
	return (
		<div
			className={cn(
				"flex justify-end gap-3 mt-6",
				"pt-4 border-t border-[var(--color-border)]",
				className,
			)}
		>
			{children}
		</div>
	);
}

/**
 * Dialog close - element that closes the dialog
 */
export function DialogClose({ children, asChild }: { children: ReactNode; asChild?: boolean }) {
	return (
		<DialogPrimitive.Close asChild={asChild}>
			{children}
		</DialogPrimitive.Close>
	);
}
