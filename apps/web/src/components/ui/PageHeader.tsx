/**
 * PageHeader
 *
 * Standard page header with title, description, context and actions.
 */

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
	title: string;
	description?: string;
	icon?: ReactNode;
	badge?: ReactNode;
	/** Acciones principales (botones) */
	actions?: ReactNode;
	/** Contexto fiscal opcional */
	fiscalContext?: {
		company?: string;
		ruc?: string;
		period?: string;
	};
	className?: string;
	as?: "header" | "div";
}

export function PageHeader({
	title,
	description,
	icon,
	badge,
	actions,
	fiscalContext,
	className,
	as = "header",
}: PageHeaderProps) {
	const Component = as;

	return (
		<Component
			aria-label="Page header"
			className={cn(
				"flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-4",
				"sm:flex-row sm:items-start sm:justify-between",
				className,
			)}
		>
			<div className="min-w-0 space-y-2">
				<div className="flex items-center gap-2">
					{icon ? (
						<span
							aria-hidden="true"
							className="shrink-0 text-[var(--text-secondary)]"
						>
							{icon}
						</span>
					) : null}
					<h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
						{title}
					</h1>
					{badge ? <div className="shrink-0">{badge}</div> : null}
				</div>

				{description ? (
					<p className="text-sm text-[var(--text-secondary)]">{description}</p>
				) : null}

				{fiscalContext ? (
					<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-secondary)]">
						{fiscalContext.company ? (
							<span>Empresa: {fiscalContext.company}</span>
						) : null}
						{fiscalContext.ruc ? <span>RUC: {fiscalContext.ruc}</span> : null}
						{fiscalContext.period ? (
							<span>Periodo: {fiscalContext.period}</span>
						) : null}
					</div>
				) : null}
			</div>

			{actions ? (
				<div className="flex shrink-0 flex-wrap items-center gap-2">
					{actions}
				</div>
			) : null}
		</Component>
	);
}
