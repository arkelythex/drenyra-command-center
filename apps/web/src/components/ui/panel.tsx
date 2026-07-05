"use client";

import type { HTMLAttributes, Ref } from "react";
import { cn } from "@/lib/utils";

export { Panel, PanelHeader, type PanelProps } from "@drenyra/ui";

// Local-only panel subcomponents not yet in @drenyra/ui
type PanelBodyProps = HTMLAttributes<HTMLDivElement> & {
	ref?: Ref<HTMLDivElement>;
};

function PanelBody({ ref, className, ...props }: PanelBodyProps) {
	return <div ref={ref} className={cn("p-4", className)} {...props} />;
}
PanelBody.displayName = "PanelBody";

type PanelDescriptionProps = HTMLAttributes<HTMLParagraphElement> & {
	ref?: Ref<HTMLParagraphElement>;
};

function PanelDescription({ ref, className, ...props }: PanelDescriptionProps) {
	return (
		<p
			ref={ref}
			className={cn(
				"text-[13px] leading-normal text-[var(--color-text-secondary)]",
				className,
			)}
			{...props}
		/>
	);
}
PanelDescription.displayName = "PanelDescription";

type PanelFooterProps = HTMLAttributes<HTMLDivElement> & {
	ref?: Ref<HTMLDivElement>;
};

function PanelFooter({ ref, className, ...props }: PanelFooterProps) {
	return (
		<footer
			ref={ref}
			className={cn(
				"flex items-center gap-2 border-t border-[var(--border-subtle)] p-4",
				className,
			)}
			{...props}
		/>
	);
}
PanelFooter.displayName = "PanelFooter";

type PanelTitleProps = HTMLAttributes<HTMLHeadingElement> & {
	ref?: Ref<HTMLHeadingElement>;
};

function PanelTitle({ ref, className, ...props }: PanelTitleProps) {
	return (
		<h3
			ref={ref}
			className={cn(
				"text-[15px] font-semibold leading-snug text-[var(--color-text-primary)]",
				className,
			)}
			{...props}
		/>
	);
}
PanelTitle.displayName = "PanelTitle";

export { PanelBody, PanelDescription, PanelFooter, PanelTitle };
