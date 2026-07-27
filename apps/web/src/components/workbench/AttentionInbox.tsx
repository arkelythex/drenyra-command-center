import {
	AlertCircle,
	AlertOctagon,
	AlertTriangle,
	CheckCircle,
	FileSearch,
	HelpCircle,
	ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
	AttentionCategory,
	AttentionItem,
} from "../../types/attention-inbox";
import {
	ATTENTION_CATEGORIES,
	calculatePriorityScore,
	priorityColor,
} from "../../types/attention-inbox";

// ─── Sub-components ──────────────────────────────────────────────────────────

function AttentionItemRow({
	item,
	onClick,
}: {
	item: AttentionItem;
	onClick: ((id: string) => void) | undefined;
}) {
	const priorityHues: Record<string, string> = {
		critical: "#dc2626",
		high: "#ea580c",
		medium: "#d97706",
		low: "#3b82f6",
	};

	return (
		<button
			type="button"
			onClick={() => onClick?.(item.id)}
			className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--surface-2)]"
		>
			<div
				className="mt-1 w-1.5 shrink-0 self-stretch rounded-full opacity-60"
				style={{ color: priorityHues[item.priority] ?? "#6b7280" }}
			/>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="truncate text-xs font-medium text-[var(--text-primary)]">
						{item.title}
					</span>
					{item.status === "in_progress" && (
						<span className="shrink-0 rounded bg-blue-500/10 px-1 py-0.5 text-[9px] font-medium text-blue-500">
							En curso
						</span>
					)}
				</div>
				<p className="mt-0.5 line-clamp-2 text-[10px] text-[var(--text-secondary)]">
					{item.description}
				</p>
				<div className="mt-1 flex items-center gap-2 text-[9px] text-[var(--text-muted)]">
					<span>{item.companyName}</span>
					{item.deadline && (
						<>
							<span>·</span>
							<span
								className={cn(
									new Date(item.deadline).getTime() - Date.now() < 86400000
										? "text-red-500 font-medium"
										: "",
								)}
							>
								Vence: {new Date(item.deadline).toLocaleDateString("es-PE")}
							</span>
						</>
					)}
					{item.materiality > 0 && (
						<>
							<span>·</span>
							<span>S/ {item.materiality.toLocaleString()}</span>
						</>
					)}
				</div>
			</div>
			<span
				className={cn(
					"shrink-0 rounded px-1 py-0.5 text-[8px] font-bold uppercase",
					priorityColor(item.priority),
				)}
			>
				{item.priority}
			</span>
		</button>
	);
}

function CategorySection({
	category,
	items,
	onItemClick,
}: {
	category: AttentionCategory;
	items: AttentionItem[];
	onItemClick: ((id: string) => void) | undefined;
}) {
	const catInfo = ATTENTION_CATEGORIES[category];
	const CatIcon = iconMap[catInfo.icon] ?? ShieldAlert;

	const colorClasses: Record<string, string> = {
		red: "text-red-500 bg-red-500/10 border-red-500/20",
		amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
		blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
		green: "text-green-500 bg-green-500/10 border-green-500/20",
	};

	const textColor =
		colorClasses[catInfo.color]?.split(" ")[0] ?? "text-gray-500";
	const badgeBg =
		colorClasses[catInfo.color]?.split(" ").slice(1).join(" ") ??
		"bg-gray-500/10 text-gray-500";
	const borderColor = `border-${catInfo.color === "red" ? "red" : catInfo.color === "amber" ? "amber" : catInfo.color === "blue" ? "blue" : "green"}-500/20`;

	return (
		<section>
			<div
				className={cn(
					"mb-2 flex items-center gap-2 border-b pb-1.5",
					borderColor,
				)}
			>
				<div
					className={cn(
						"flex h-5 w-5 items-center justify-center rounded",
						textColor,
					)}
				>
					<CatIcon size={13} />
				</div>
				<span className="text-xs font-semibold text-[var(--text-primary)]">
					{catInfo.label}
				</span>
				<span
					className={cn(
						"ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold",
						badgeBg,
					)}
				>
					{items.length}
				</span>
			</div>
			<div className="space-y-1">
				{items.map((item) => (
					<AttentionItemRow key={item.id} item={item} onClick={onItemClick} />
				))}
			</div>
		</section>
	);
}

const iconMap: Record<string, typeof ShieldAlert> = {
	ShieldAlert,
	AlertTriangle,
	AlertOctagon,
	FileSearch,
	HelpCircle,
	AlertCircle,
	CheckCircle,
};

// ─── Main component ─────────────────────────────────────────────────────────

interface AttentionInboxProps {
	items: AttentionItem[];
	onItemClick?: (id: string) => void;
	className?: string;
}

export function AttentionInbox({
	items,
	onItemClick,
	className,
}: AttentionInboxProps) {
	// Group by category
	const grouped = items.reduce<
		Partial<Record<AttentionCategory, AttentionItem[]>>
	>((acc, item) => {
		const cat = item.category as AttentionCategory;
		const existing = acc[cat];
		if (existing) {
			existing.push(item);
		} else {
			acc[cat] = [item];
		}
		return acc;
	}, {});

	// Sort categories by highest priority item first
	const sortedCategories = (
		Object.keys(ATTENTION_CATEGORIES) as AttentionCategory[]
	)
		.filter((cat) => {
			const g = grouped[cat];
			return g !== undefined && g.length > 0;
		})
		.sort((a, b) => {
			const gA = grouped[a];
			const gB = grouped[b];
			const maxA = gA ? Math.max(...gA.map(calculatePriorityScore)) : 0;
			const maxB = gB ? Math.max(...gB.map(calculatePriorityScore)) : 0;
			return maxB - maxA;
		});

	if (items.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-16 text-center">
				<CheckCircle size={32} className="text-green-500" />
				<p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
					Todo al día
				</p>
				<p className="mt-1 text-xs text-[var(--text-muted)]">
					No hay elementos que requieran atención
				</p>
			</div>
		);
	}

	return (
		<div className={cn("space-y-6", className)}>
			{sortedCategories.map((category) => {
				const catGroup = grouped[category];
				if (!catGroup) return null;
				const sorted = [...catGroup].sort(
					(a, b) => calculatePriorityScore(b) - calculatePriorityScore(a),
				);
				return (
					<CategorySection
						key={category}
						category={category}
						items={sorted}
						onItemClick={onItemClick}
					/>
				);
			})}
		</div>
	);
}
