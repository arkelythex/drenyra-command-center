import {
	ChevronDown,
	FileSearch,
	MessageCircle,
	ShieldCheck,
	ThumbsDown,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAgenticShell } from "@/stores/agentic-shell.store";
import type { AgentSessionStatusDTO } from "./agents.types";

export interface AgentActionMenuProps {
	session: AgentSessionStatusDTO;
}

export function AgentActionMenu({ session }: AgentActionMenuProps) {
	const [open, setOpen] = useState(false);
	const openInspector = useAgenticShell((s) => s.openInspector);

	const isActionable =
		session.requiresAction || session.status === "awaiting_approval";

	if (!isActionable) return null;

	return (
		<div className="relative">
			<Button
				variant="secondary"
				size="sm"
				onClick={() => setOpen(!open)}
				className="text-xs"
			>
				<ChevronDown size={12} className="mr-1" />
				Acciones
			</Button>

			{open && (
				<>
					<button
						type="button"
						className="fixed inset-0 z-10 cursor-default"
						tabIndex={-1}
						aria-hidden="true"
						onClick={() => setOpen(false)}
					/>
					<div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] py-1 shadow-lg">
						<button
							type="button"
							className="flex w-full items-center gap-2 px-4 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
							onClick={() => {
								openInspector({
									type: "diff" as never,
									id: "diff-review" as never,
									title: "Diff review" as never,
								});
								setOpen(false);
							}}
						>
							<FileSearch size={14} />
							Review diff
						</button>
						<button
							type="button"
							className="flex w-full items-center gap-2 px-4 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
							onClick={() => {
								openInspector({
									type: "evidence" as never,
									id: "evidence-review" as never,
									title: "Evidence review" as never,
								});
								setOpen(false);
							}}
						>
							<FileSearch size={14} />
							Open evidence
						</button>
						<hr className="mx-2 border-[var(--border-subtle)]" />
						<button
							type="button"
							className="flex w-full items-center gap-2 px-4 py-2 text-xs text-emerald-600 hover:bg-[var(--surface-2)]"
							onClick={() => setOpen(false)}
						>
							<ShieldCheck size={14} />
							Approve
						</button>
						<button
							type="button"
							className="flex w-full items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-[var(--surface-2)]"
							onClick={() => setOpen(false)}
						>
							<ThumbsDown size={14} />
							Reject
						</button>
						<button
							type="button"
							className="flex w-full items-center gap-2 px-4 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
							onClick={() => setOpen(false)}
						>
							<MessageCircle size={14} />
							Pedir sustento
						</button>
					</div>
				</>
			)}
		</div>
	);
}
