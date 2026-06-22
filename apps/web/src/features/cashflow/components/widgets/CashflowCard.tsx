import { useDraggable } from "@dnd-kit/core";
import {
	ArrowDownRight,
	ArrowUpRight,
	Clock,
	MoreHorizontal,
} from "lucide-react";
import type { JSX } from "react";
import { Card } from "../../../../components/ui/card";
import { cn, n } from "../../../../lib/utils";
import type { CashflowTask } from "../../hooks/useCashflow";

interface CashflowCardProps {
	task: CashflowTask;
	index: number;
}

export const CashflowCard = ({ task }: CashflowCardProps): JSX.Element => {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: task.id,
		});

	const style = transform
		? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
		: undefined;

	const formatMoney = n;

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "HIGH":
				return "text-red-600 bg-red-500/10 border-red-500/20";
			case "MEDIUM":
				return "text-orange-600 bg-orange-500/10 border-orange-500/20";
			case "LOW":
				return "text-[var(--premium-action-cyan)] bg-[rgba(var(--premium-info-rgb),0.10)] border-[rgba(var(--premium-info-rgb),0.20)]";
			default:
				return "text-muted-foreground bg-muted border-border";
		}
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...listeners}
			className={cn(
				"cursor-grab transition-[transform,opacity] duration-200 active:cursor-grabbing",
				isDragging ? "z-50 scale-[1.03] opacity-50" : "hover:scale-[1.01]",
			)}
		>
			<Card
				className={cn(
					"group relative overflow-hidden p-5 transition-[background-color,border-color,box-shadow,transform,color] duration-200",
					isDragging
						? "rotate-1 border-transparent bg-foreground text-background shadow-xl shadow-[0_0_20px_rgba(var(--premium-info-rgb),0.22)] ring-2 ring-[rgba(var(--premium-info-rgb),0.35)] ring-offset-2 ring-offset-background"
						: "bg-card border-border/40 shadow-sm hover:shadow-lg hover:border-[rgba(var(--premium-info-rgb),0.20)] hover:bg-card/80",
				)}
			>
				{!isDragging && (
					<div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
				)}

				<div className="flex justify-between items-start mb-4 relative z-10">
					<div className="flex items-center gap-2.5">
						<div
							className={cn(
								"rounded-lg border p-1.5 transition-[background-color,border-color,color,transform] duration-200",
								isDragging
									? "bg-background/20 text-background border-transparent"
									: "bg-background border-border/50 text-muted-foreground group-hover:text-foreground group-hover:border-foreground/20",
							)}
						>
							{task.type === "INCOME" ? (
								<ArrowDownRight
									size={14}
									strokeWidth={2.5}
									className={cn(!isDragging && "text-[var(--premium-success)]")}
								/>
							) : (
								<ArrowUpRight
									size={14}
									strokeWidth={2.5}
									className={cn(!isDragging && "text-red-500")}
								/>
							)}
						</div>
						<span
							className={cn(
								"text-3xs font-black px-2 py-0.5 rounded border uppercase tracking-widest transition-colors",
								isDragging
									? "border-transparent bg-background/20 text-background"
									: getPriorityColor(task.priority),
							)}
						>
							{task.priority}
						</span>
					</div>
					<button
						className={cn(
							"rounded-md p-1 transition-[background-color,color,opacity] duration-200",
							isDragging
								? "text-background/80 hover:text-background hover:bg-background/20"
								: "text-muted-foreground hover:text-foreground hover:bg-muted/50 opacity-0 group-hover:opacity-100",
						)}
					>
						<MoreHorizontal size={16} />
					</button>
				</div>

				<h4
					className={cn(
						"font-bold text-xs uppercase tracking-tight truncate mb-5 relative z-10",
						isDragging ? "text-background" : "text-foreground/90",
					)}
				>
					{task.title}
				</h4>

				<div className="flex justify-between items-end relative z-10">
					<div className="flex flex-col">
						<span
							className={cn(
								"text-3xs font-black uppercase tracking-widest mb-0.5 opacity-60",
								isDragging ? "text-background" : "text-muted-foreground",
							)}
						>
							Monto
						</span>
						<span
							className={cn(
								"font-black font-mono text-base tracking-tighter tabular-nums",
								isDragging ? "text-background" : "text-foreground",
							)}
						>
							{formatMoney(task.amount)}
						</span>
					</div>

					<div
						className={cn(
							"flex items-center text-3xs font-bold gap-1.5 uppercase tracking-wider py-1 px-2 rounded-md",
							isDragging
								? "bg-background/20 text-background"
								: "bg-muted/30 text-muted-foreground border border-border/30",
						)}
					>
						<Clock size={10} strokeWidth={2.5} /> {task.date}
					</div>
				</div>
			</Card>
		</div>
	);
};
