import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
	id: string;
	title: string;
	count: number;
	total?: string;
	children: ReactNode;
	active?: boolean;
}

/** One status column of the collections board; a drop target while dragging. */
export const KanbanColumn = ({
	id,
	title,
	count,
	total,
	children,
	active,
}: KanbanColumnProps) => {
	const { setNodeRef, isOver } = useDroppable({ id });

	return (
		<section
			ref={setNodeRef}
			aria-label={title}
			className={cn(
				"flex w-[300px] shrink-0 snap-start flex-col rounded-xl p-1 transition-colors md:w-[340px] lg:w-80 xl:w-[360px] 2xl:w-80",
				isOver && "bg-muted ring-2 ring-ring/50",
			)}
		>
			<header className="mb-3 flex items-center justify-between gap-3 px-2">
				<h3
					className={cn(
						"text-sm font-medium",
						active ? "text-foreground" : "text-muted-foreground",
					)}
				>
					{title}
				</h3>
				<p className="flex items-center gap-2 font-mono text-sm tabular-nums text-muted-foreground">
					<span>
						{count}
						<span className="sr-only"> facturas</span>
					</span>
					{total ? (
						<>
							<span aria-hidden="true">·</span>
							<span className="text-foreground">{total}</span>
						</>
					) : null}
				</p>
			</header>

			<div className="no-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto pb-10">
				{children}
			</div>
		</section>
	);
};
