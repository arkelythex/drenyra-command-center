"use client";

import type { ReactNode, ReactElement } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { ApiDocsSidebar } from "@/components/api/ApiDocsSidebar";
import { Logo } from "@/components/navbar/components/Logo";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";

type ApiDocsShellProps = {
	children: ReactNode;
};

export function ApiDocsShell({ children }: ApiDocsShellProps): ReactElement {
	const [mobileNavOpen, setMobileNavOpen] = useState(false);

	const menuButtonRef = useRef<HTMLButtonElement>(null);
	const drawerPanelRef = useRef<HTMLDivElement>(null);
	const closeBtnRef = useRef<HTMLButtonElement>(null);
	const prevDrawerOpen = useRef(false);
	const titleId = useId();

	const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

	useFocusTrap(mobileNavOpen, drawerPanelRef);

	useEffect(() => {
		if (prevDrawerOpen.current && !mobileNavOpen) {
			menuButtonRef.current?.focus();
		}
		prevDrawerOpen.current = mobileNavOpen;
	}, [mobileNavOpen]);

	useEffect(() => {
		if (!mobileNavOpen) return;
		const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0);
		return () => window.clearTimeout(t);
	}, [mobileNavOpen]);

	useEffect(() => {
		if (!mobileNavOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") closeMobileNav();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [mobileNavOpen, closeMobileNav]);

	useEffect(() => {
		if (!mobileNavOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [mobileNavOpen]);

	return (
		<div className="docs-shell relative min-h-screen bg-background font-sans text-foreground">
			<a
				href="#api-main"
				className="pointer-events-none fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground opacity-0 transition focus:pointer-events-auto focus:translate-y-0 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
			>
				Saltar al contenido
			</a>

			<div
				aria-hidden
				className="pointer-events-none docs-shell-grid fixed inset-0"
			/>
			<div
				aria-hidden
				className="pointer-events-none docs-shell-ambient fixed inset-0"
			/>

			<header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
				<div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
					<div className="flex min-w-0 items-center gap-2 lg:gap-3">
						<button
							ref={menuButtonRef}
							type="button"
							className="inline-flex h-12 min-h-[3rem] min-w-[3rem] items-center justify-center rounded-lg border border-border bg-card/40 text-foreground lg:hidden"
							aria-expanded={mobileNavOpen}
							aria-controls="api-docs-mobile-nav"
							aria-label={
								mobileNavOpen
									? "Cerrar navegación de API Docs"
									: "Abrir navegación de API Docs"
							}
							onClick={() => setMobileNavOpen((open) => !open)}
						>
							{mobileNavOpen ? (
								<X className="h-5 w-5" aria-hidden />
							) : (
								<Menu className="h-5 w-5" aria-hidden />
							)}
						</button>
						<Logo />
						<span className="hidden truncate text-sm font-semibold text-foreground sm:inline">
							API Platform
						</span>
					</div>
					<Link
						href="/"
						className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-border bg-card/40 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
					>
						Ir al sitio
					</Link>
				</div>
			</header>

			{mobileNavOpen ? (
				<div className="fixed inset-0 z-[60] lg:hidden">
					<button
						type="button"
						className="absolute inset-0 bg-background/75 backdrop-blur-[2px]"
						aria-label="Cerrar navegación de API Docs"
						onClick={closeMobileNav}
					/>
					<div
						ref={drawerPanelRef}
						id="api-docs-mobile-nav"
						role="dialog"
						aria-modal="true"
						aria-labelledby={titleId}
						className="absolute bottom-0 left-0 top-0 flex w-[min(100vw-2.5rem,20rem)] flex-col border-r border-border bg-sidebar-bg shadow-2xl shadow-[rgba(0,0,0,0.55)]"
					>
						<div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
							<p id={titleId} className="text-sm font-semibold text-foreground">
								Navegación
							</p>
							<button
								ref={closeBtnRef}
								type="button"
								className="inline-flex h-12 min-h-[3rem] min-w-[3rem] items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-card/50 hover:text-foreground"
								onClick={closeMobileNav}
							>
								<X className="h-5 w-5" aria-hidden />
								<span className="sr-only">Cerrar</span>
							</button>
						</div>
						<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
							<ApiDocsSidebar
								onNavigate={closeMobileNav}
								className="border-0"
								scrollableNav={false}
							/>
						</div>
					</div>
				</div>
			) : null}

			<div className="relative grid min-h-0 items-stretch landing-min-h-doc-chrome lg:grid-cols-[280px_minmax(0,1fr)]">
				<aside className="sticky top-16 z-20 hidden h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] min-h-0 w-full min-w-0 max-w-full overflow-hidden border-r border-border bg-sidebar-bg lg:flex lg:flex-col">
					<ApiDocsSidebar className="min-h-0 flex-1" />
				</aside>

				<main
					id="api-main"
					tabIndex={-1}
					className="relative min-w-0 overflow-x-hidden px-4 py-8 outline-none sm:px-8 lg:px-12"
				>
					<div className="mx-auto max-w-4xl">{children}</div>
				</main>
			</div>
		</div>
	);
}
