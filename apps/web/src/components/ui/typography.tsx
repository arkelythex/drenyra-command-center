/**
 * @deprecated Import Text from '@/components/atoms/text' instead.
 *
 * This file exists for backward compatibility during the Phase 2.4 migration.
 * Please update your imports to use the canonical Text component.
 *
 * The FinancialLabel compound component is preserved but deprecated.
 * See /docs/05-development/design-system/text-component.md for migration details.
 */

import { Text } from "@/components/atoms/text";

export type {
	TextProps,
	TextVariant,
	TextWeight,
} from "@/components/atoms/text";

import { cn } from "@/lib/utils";

/**
 * @deprecated FinancialLabel is deprecated.
 * Build inline compositions using the unified Text component instead.
 *
 * Example:
 * ```tsx
 * <div className="flex flex-col gap-2">
 *   <Text variant="label">Label</Text>
 *   <div className="flex items-center gap-3">
 *     <Text variant="data">{value}</Text>
 *   </div>
 * </div>
 * ```
 */
export const FinancialLabel = ({
	label,
	value,
	trend,
}: {
	label: string;
	value: string;
	trend?: "up" | "down";
}) => (
	<div className="flex flex-col gap-2">
		<Text variant="label">{label}</Text>
		<div className="flex items-center gap-3">
			<Text variant="data">{value}</Text>
			{trend && (
				<div
					className={cn(
						"flex items-center gap-1 rounded-lg border px-2 py-0.5 text-3xs font-black uppercase tracking-widest shadow-sm transition-[background-color,border-color,color,box-shadow] duration-200",
						trend === "up"
							? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20"
							: "bg-red-500/10 text-red-500 border-red-500/20",
					)}
				>
					{trend === "up" ? "↑" : "↓"}
					<span>{trend === "up" ? "Gain" : "Risk"}</span>
				</div>
			)}
		</div>
	</div>
);
