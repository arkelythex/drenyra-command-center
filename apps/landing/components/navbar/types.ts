/**
 * Navbar Types - Simplified for 2026
 * Single Responsibility: Type definitions only
 */

import type { ReactNode } from "react";

// ============================================================================
// Domain Entities
// ============================================================================

// Simplified NavItem - no dropdowns for 2026 conversion optimization
export interface NavItem {
	readonly name: string;
	readonly href: string;
}

// ============================================================================
// Component Props
// ============================================================================

export interface NavItemProps {
	readonly item: NavItem;
	readonly isActive: boolean;
	readonly onClick: () => void;
}

export interface MobileNavProps {
	readonly isOpen: boolean;
	readonly onClose: () => void;
	readonly navItems: readonly NavItem[];
	readonly isNavItemActive: (item: NavItem) => boolean;
	/** Hash o ruta: en home hace scroll + foco en heading; siempre cierra el menú móvil. */
	readonly onItemClick: (href: string) => void;
}

export interface DesktopNavProps {
	readonly navItems: readonly NavItem[];
	readonly isNavItemActive: (item: NavItem) => boolean;
	readonly onItemClick: (href: string) => void;
}

export interface LogoProps {
	readonly href?: string;
	readonly compact?: boolean;
}

export interface CTAButtonsProps {
	readonly className?: string;
	readonly onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
	readonly compact?: boolean;
}

export interface SkipLinkProps {
	readonly href: string;
	readonly children: ReactNode;
}
