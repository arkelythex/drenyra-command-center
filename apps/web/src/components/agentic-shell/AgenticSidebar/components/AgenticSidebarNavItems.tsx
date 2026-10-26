import {
	Link,
	type LinkProps,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { createElement } from "react";
import { cn } from "@/lib/utils";
import { useAgenticShell } from "@/stores/agentic-shell.store";
import { AGENTIC_SECTIONS } from "../AgenticSidebar.data";

interface AgenticSidebarNavItemsProps {
	isCollapsed: boolean;
}

/**
 * Primary navigation. Entries are real links (middle-click and "open in new
 * tab" work); the active one is marked with aria-current and a heavier weight,
 * not color alone.
 */
export function AgenticSidebarNavItems({
	isCollapsed,
}: AgenticSidebarNavItemsProps) {
	const navigate = useNavigate();
	const closeSidebar = useAgenticShell((s) => s.setSidebarMobileOpen);
	const { pathname } = useLocation();

	if (isCollapsed) return null;

	return (
		<nav
			aria-label="Secciones"
			className="flex-1 space-y-5 overflow-y-auto px-3 pt-3 scrollbar-none"
		>
			<button
				type="button"
				onClick={() => {
					closeSidebar(false);
					navigate({ to: "/cierre-mensual" });
				}}
				className="flex h-9 w-full items-center gap-2 rounded-lg border border-border px-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
			>
				<Plus aria-hidden="true" className="size-4 text-muted-foreground" />
				Nuevo cierre mensual
			</button>

			{AGENTIC_SECTIONS.map((section) => (
				<div key={section.title}>
					<p className="mb-1 px-2.5 text-xs font-medium text-muted-foreground">
						{section.title}
					</p>
					<ul className="space-y-px">
						{section.items.map((item) => {
							const isActive =
								pathname === item.to || pathname.startsWith(`${item.to}/`);
							return (
								<li key={item.id}>
									<Link
										// Items come from AGENTIC_NAV_ITEMS filtered to routes that exist (isAvailableNavPath).
										to={item.to as LinkProps["to"]}
										onClick={() => closeSidebar(false)}
										aria-current={isActive ? "page" : undefined}
										className={cn(
											"flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
											isActive
												? "bg-muted font-medium text-foreground"
												: "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
										)}
									>
										{createElement(item.icon, {
											"aria-hidden": true,
											className: cn(
												"size-4 shrink-0",
												isActive ? "text-foreground" : "text-muted-foreground",
											),
										})}
										<span className="flex-1 truncate">{item.label}</span>
										{item.badge !== undefined && (
											<span className="rounded-md bg-muted px-1.5 text-xs font-medium tabular-nums text-foreground">
												{item.badge}
											</span>
										)}
									</Link>
								</li>
							);
						})}
					</ul>
				</div>
			))}
		</nav>
	);
}
