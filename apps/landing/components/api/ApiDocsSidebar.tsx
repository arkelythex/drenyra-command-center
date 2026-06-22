"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import {
	API_DOCS_NAV_SECTIONS,
	isApiDocsNavLinkActive,
} from "@/components/api/api-docs-nav";
import { cn } from "@/lib/utils";

type ApiDocsSidebarProps = {
	onNavigate?: () => void;
	className?: string;
	/** Drawer panel: scroll lives on parent; desktop aside scrolls nav. */
	scrollableNav?: boolean;
};

export function ApiDocsSidebar({
	onNavigate,
	className,
	scrollableNav = true,
}: ApiDocsSidebarProps): ReactElement {
	const pathname = usePathname();
	const [hash, setHash] = useState("");

	useEffect(() => {
		const syncHash = () => setHash(window.location.hash);
		syncHash();
		window.addEventListener("hashchange", syncHash);
		return () => window.removeEventListener("hashchange", syncHash);
	}, []);

	const handleNavigate = useCallback(() => {
		onNavigate?.();
	}, [onNavigate]);

	return (
		<div
			className={cn(
				"flex h-full min-h-0 w-full min-w-0 max-w-full flex-col",
				className,
			)}
		>
			<nav
				aria-label="API documentation"
				className={cn(
					"docs-sidebar-nav flex min-h-0 flex-1 flex-col px-2 py-3 sm:px-3 lg:pt-4",
					scrollableNav && "overflow-y-auto overscroll-contain",
				)}
			>
				{API_DOCS_NAV_SECTIONS.map((section) => (
					<section key={section.label} className="mb-6 last:mb-2">
						<h3 className="mb-2 px-2.5 text-label font-bold uppercase tracking-[0.12em] text-section-label">
							{section.label}
						</h3>
						<ul className="space-y-0.5">
							{section.links.map((link) => {
								const active = isApiDocsNavLinkActive(
									link.href,
									pathname,
									hash,
								);
								const linkClass = cn(
									"flex min-h-11 items-center justify-between gap-2 rounded-md border border-transparent px-2.5 py-2 text-sm text-muted-foreground transition-colors",
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-bg)]",
									active
										? "border-primary/30 bg-primary/10 font-medium text-foreground ring-1 ring-primary/20"
										: "hover:bg-card/40 hover:text-foreground",
								);

								if (link.external) {
									return (
										<li key={`${section.label}-${link.label}`}>
											<a
												href={link.href}
												target="_blank"
												rel="noopener noreferrer"
												className={linkClass}
												onClick={handleNavigate}
											>
												<span>{link.label}</span>
												<ArrowUpRight
													className="h-3.5 w-3.5 shrink-0 opacity-70"
													aria-hidden
												/>
											</a>
										</li>
									);
								}

								return (
									<li key={`${section.label}-${link.label}`}>
										<Link
											href={link.href}
											className={linkClass}
											onClick={handleNavigate}
											aria-current={active ? "location" : undefined}
										>
											<span>{link.label}</span>
											{active ? (
												<span
													className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
													aria-hidden
												/>
											) : null}
										</Link>
									</li>
								);
							})}
						</ul>
					</section>
				))}
			</nav>

			<div className="shrink-0 border-t border-border/50 bg-sidebar-bg/95 p-2.5 sm:p-3">
				<div className="rounded-lg border border-border/50 bg-card/30 p-3">
					<p className="text-xs font-semibold text-foreground">
						¿Listo para integrar?
					</p>
					<p className="mt-1 text-2xs leading-relaxed text-muted-foreground">
						Solicita acceso sandbox y API key desde demo.
					</p>
					<Link
						href="/demo"
						onClick={handleNavigate}
						className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-accent"
					>
						Solicitar API key
						<ArrowUpRight className="h-3 w-3" aria-hidden />
					</Link>
				</div>
			</div>
		</div>
	);
}
