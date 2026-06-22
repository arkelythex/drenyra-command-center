import type { ReactNode } from "react";
import { Text } from "@/components/atoms/text";
import { cn } from "@/lib/utils";

interface StatCardProps {
	label: string;
	value: string;
	tone?: "muted" | "success" | "danger" | "info" | "default";
	icon?: ReactNode;
}

export const KPICard = ({
	label,
	value,
	tone = "muted",
	icon,
}: StatCardProps) => (
	<div className="ui-card-surface rounded-xl px-4 py-3">
		<Text
			variant="label"
			className="mb-2 block text-2xs leading-none text-muted-foreground"
		>
			{label}
		</Text>
		<div className="flex items-center gap-2">
			{icon && <div className="text-muted-foreground">{icon}</div>}
			<Text
				variant="data"
				className={cn(
					"text-base tracking-tight",
					tone === "success"
						? "text-success"
						: tone === "danger"
							? "text-danger"
							: tone === "info"
								? "text-info"
								: "text-foreground",
				)}
			>
				{value}
			</Text>
		</div>
	</div>
);

interface SummaryCardProps {
	label: string;
	value: string;
	icon?: ReactNode;
	tone?: "default" | "danger" | "muted" | "success" | "info";
}

export const SummaryCard = ({
	label,
	value,
	icon,
	tone = "default",
}: SummaryCardProps) => (
	<div className="ui-card-surface rounded-xl px-4 py-3">
		<Text variant="label" className="mb-1 block text-2xs text-muted-foreground">
			{label}
		</Text>
		<div className="flex items-center gap-3">
			{icon && (
				<div
					className={cn(
						tone === "danger"
							? "text-danger"
							: tone === "success"
								? "text-success"
								: "text-info",
					)}
				>
					{icon}
				</div>
			)}
			<Text
				variant="body"
				className={cn(
					"font-bold tracking-tight",
					tone === "danger"
						? "text-danger"
						: tone === "success"
							? "text-success"
							: "text-foreground",
				)}
			>
				{value}
			</Text>
		</div>
	</div>
);

export type { StatCardProps, SummaryCardProps };
