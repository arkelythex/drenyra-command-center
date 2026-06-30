import { FileText, Link2, ListTree } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ArtifactSidebarItem {
	id: string;
	kind: "plan" | "source" | "file";
	label: string;
	href?: string;
	description?: string;
}

export interface ArtifactSidebarProps {
	items: ArtifactSidebarItem[];
	title?: string;
	className?: string;
}

/**
 * Codex-style sidebar artifacts — plans, sources, file previews.
 */
export function ArtifactSidebar({
	items,
	title = "Artifacts",
	className,
}: ArtifactSidebarProps) {
	if (items.length === 0) return null;

	const iconFor = (kind: ArtifactSidebarItem["kind"]) => {
		switch (kind) {
			case "plan":
				return ListTree;
			case "source":
				return Link2;
			default:
				return FileText;
		}
	};

	return (
		<aside
			className={cn("border-t border-[var(--border-subtle)] pt-3", className)}
			aria-label={title}
			data-component="artifact-sidebar"
		>
			<h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
				{title}
			</h4>
			<ul className="space-y-1">
				{items.map((item) => {
					const Icon = iconFor(item.kind);
					const content = (
						<>
							<Icon
								className="size-3.5 shrink-0 text-[var(--text-muted)]"
								aria-hidden
							/>
							<span className="truncate text-sm text-[var(--text-primary)]">
								{item.label}
							</span>
						</>
					);
					return (
						<li key={item.id}>
							{item.href ? (
								<a
									href={item.href}
									className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--surface-2)]"
								>
									{content}
								</a>
							) : (
								<div className="flex items-center gap-2 rounded-md px-2 py-1.5">
									{content}
								</div>
							)}
							{item.description ? (
								<p className="ml-6 truncate text-xs text-[var(--text-muted)]">
									{item.description}
								</p>
							) : null}
						</li>
					);
				})}
			</ul>
		</aside>
	);
}
