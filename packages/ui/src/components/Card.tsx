/**
 * Card Component
 *
 * Content container with glassmorphism styling.
 * Supports hoverable variant for interactive cards.
 *
 * @example
 * ```tsx
 * <Card hoverable>
 *   <CardHeader>
 *     <CardTitle>Invoice #1234</CardTitle>
 *     <CardDescription>Due in 30 days</CardDescription>
 *   </CardHeader>
 *   <CardContent>$1,500.00 PEN</CardContent>
 * </Card>
 * ```
 */

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
	/** Child content */
	children?: ReactNode;
	/** Enable hover effect for interactive cards */
	hoverable?: boolean;
	/** Enable hover animation (legacy, no-op in shared) */
	animateOnHover?: boolean;
}

/**
 * Glassmorphism card with backdrop blur.
 * Uses surface tokens for consistent theming.
 */
export function Card({
	hoverable = false,
	className,
	children,
	...props
}: CardProps) {
	return (
		<div
			className={cn(
				"rounded-[var(--radius-lg)] border border-[var(--glass-border)]",
				"bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)]",
				"shadow-[var(--shadow-md)]",
				"transition-all duration-300",
				hoverable &&
					[
						"hover:border-[var(--color-primary)]",
						"hover:shadow-[var(--shadow-lg)]",
						"hover:shadow-[var(--shadow-primary)]",
						"cursor-pointer",
					].join(" "),
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
	children?: ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
	return (
		<div
			className={cn(
				"flex flex-col gap-[var(--density-gap-sm)] p-[var(--density-pad-lg)]",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
	children?: ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
	return (
		<h3
			className={cn(
				"text-base font-semibold text-[var(--color-text-primary)]",
				className,
			)}
			{...props}
		>
			{children}
		</h3>
	);
}

export interface CardDescriptionProps
	extends HTMLAttributes<HTMLParagraphElement> {
	children?: ReactNode;
}

export function CardDescription({
	className,
	children,
	...props
}: CardDescriptionProps) {
	return (
		<p
			className={cn("text-sm text-[var(--color-text-secondary)]", className)}
			{...props}
		>
			{children}
		</p>
	);
}

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
	children?: ReactNode;
}

export function CardContent({
	className,
	children,
	...props
}: CardContentProps) {
	return (
		<div className={cn("p-[var(--density-pad-lg)] pt-0", className)} {...props}>
			{children}
		</div>
	);
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
	children?: ReactNode;
}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
	return (
		<div
			className={cn(
				"flex items-center gap-[var(--density-gap-md)] p-[var(--density-pad-lg)] pt-0",
				"border-t border-[var(--color-border-subtle)]",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}
