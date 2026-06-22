/**
 * Navbar flotante (mismo shell en `/`, `/drenyra`, API):
 * `max-w-5xl` rounded-full, blur, pill activa en desktop, scroll-spy en home.
 *
 * Enlaces del home: `NAVBAR_LINKS` (`lib/landing/section-registry.ts`).
 * `components/layout/navbar.tsx` queda como variante antigua / referencia.
 */

"use client";

import type { ReactElement } from "react";
import { useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";

import { useScrollDirection, useScrollSpy } from "@/lib/hooks";
import { resolveV2SectionNavigationTarget } from "@/lib/landing/section-registry";

import { SECTION_IDS, getNavItems } from "./constants";
import { useClickOutside, useMobileMenu } from "./hooks";
import {
	CTAButtons,
	DesktopNav,
	Logo,
	MobileMenuButton,
	MobileNav,
	SkipLink,
} from "./components";
import type { NavItem } from "./types";

function normalizeSectionHref(href: string): string {
	if (href.startsWith("/#")) {
		return href.slice(1);
	}

	return href;
}

export function Navbar(): ReactElement {
	const pathname = usePathname();
	const isHome = pathname === "/";
	const { isScrolled, isAtTop, scrollY } = useScrollDirection({
		threshold: 10,
	});
	const detectedSection = useScrollSpy([...SECTION_IDS], { threshold: 0.3 });
	const activeSection = isHome ? detectedSection : "";

	const resolvedNavItems = useMemo(
		(): readonly NavItem[] =>
			getNavItems(pathname).map((item) => ({
				...item,
				href:
					!isHome && item.href.startsWith("#") ? `/${item.href}` : item.href,
			})),
		[isHome, pathname],
	);

	const {
		isOpen: isMobileOpen,
		toggle: toggleMobile,
		close: closeMobile,
		menuRef,
		menuId,
		triggerRef,
	} = useMobileMenu();

	const { ref: navRef } = useClickOutside<HTMLElement>(() => {
		closeMobile();
	});

	const isNavItemActive = useCallback(
		(item: NavItem): boolean => {
			const normalizedHref = normalizeSectionHref(item.href);

			if (!isHome || !activeSection || !normalizedHref.startsWith("#")) {
				return false;
			}

			return normalizedHref.replace("#", "") === activeSection;
		},
		[activeSection, isHome],
	);

	const handleItemClick = useCallback(
		(href: string): void => {
			const normalizedHref = normalizeSectionHref(href);

			if (isHome && normalizedHref.startsWith("#")) {
				const target =
					resolveV2SectionNavigationTarget(href) ??
					resolveV2SectionNavigationTarget(normalizedHref);
				const id = target?.anchorId ?? normalizedHref.replace(/^#/, "");
				const element = document.getElementById(id);
				if (element) {
					element.scrollIntoView({ behavior: "smooth" });
					const heading = element.querySelector<HTMLElement>(
						"[data-section-heading], h1, h2, h3",
					);
					if (heading) {
						if (!heading.hasAttribute("tabindex"))
							heading.setAttribute("tabindex", "-1");
						heading.focus({ preventScroll: true });
					}
				}
			}

			closeMobile();
		},
		[closeMobile, isHome],
	);

	const isDeepScroll = scrollY > 100;
	const isHeroTop = isHome && isAtTop && !isDeepScroll;

	return (
		<>
			<SkipLink href="#main-content">Saltar al contenido principal</SkipLink>

			<div className="landing-nav-fixed-outer fixed left-0 right-0 z-50">
				<nav
					ref={navRef}
					className={`mx-auto max-w-5xl rounded-2xl border backdrop-blur-xl transition-all duration-300 md:rounded-full ${
						isHeroTop
							? "border-transparent bg-transparent shadow-none"
							: isDeepScroll
								? "border-foreground/15 bg-background/80 shadow-lg shadow-black/40 py-0.5"
								: isScrolled && !isAtTop
									? "border-foreground/10 bg-background/50 shadow-md shadow-black/30"
									: "border-foreground/10 bg-background/35 shadow-md shadow-black/25"
					}`}
					role="navigation"
					aria-label="Navegación principal"
				>
					<div
						className={`flex items-center justify-between transition-all duration-300 ${
							isDeepScroll
								? "px-3.5 py-1.5 md:px-5"
								: "px-3.5 py-2 md:px-6 md:py-2.5"
						}`}
					>
						<Logo compact={isDeepScroll} />

						<DesktopNav
							navItems={resolvedNavItems}
							isNavItemActive={isNavItemActive}
							onItemClick={handleItemClick}
						/>

						<div className="flex items-center gap-2">
							<CTAButtons className="hidden lg:flex" compact={isDeepScroll} />
							<MobileMenuButton
								ref={triggerRef}
								isOpen={isMobileOpen}
								onClick={toggleMobile}
								aria-controls={menuId}
							/>
						</div>
					</div>

					<MobileNav
						ref={menuRef}
						id={menuId}
						isOpen={isMobileOpen}
						onClose={closeMobile}
						navItems={resolvedNavItems}
						isNavItemActive={isNavItemActive}
						onItemClick={handleItemClick}
					/>
				</nav>
			</div>
		</>
	);
}
