import { create } from "zustand";

export interface SidebarLayoutState {
	isCollapsed: boolean;
	isMobileOpen: boolean;
	isFocusMode: boolean;
	isNotificationsOpen: boolean;
	setIsCollapsed: (value: boolean) => void;
	setIsMobileOpen: (value: boolean) => void;
	setIsFocusMode: (value: boolean) => void;
	setIsNotificationsOpen: (value: boolean) => void;
	toggleCollapsed: () => void;
	toggleMobileOpen: () => void;
}

/**
 * Sidebar layout UI state (Phase 3 — replaces SidebarLayoutContext useState).
 */
export const useSidebarLayoutStore = create<SidebarLayoutState>((set, get) => ({
	isCollapsed: false,
	isMobileOpen: false,
	isFocusMode: false,
	isNotificationsOpen: false,
	setIsCollapsed: (isCollapsed) => set({ isCollapsed }),
	setIsMobileOpen: (isMobileOpen) => set({ isMobileOpen }),
	setIsFocusMode: (isFocusMode) => set({ isFocusMode }),
	setIsNotificationsOpen: (isNotificationsOpen) => set({ isNotificationsOpen }),
	toggleCollapsed: () => set({ isCollapsed: !get().isCollapsed }),
	toggleMobileOpen: () => set({ isMobileOpen: !get().isMobileOpen }),
}));

/**
 * Convenience hook — same shape as the old SidebarLayoutContext.
 * Consumers should import this directly.
 */
export function useSidebarLayout(): SidebarLayoutState {
	return {
		isCollapsed: useSidebarLayoutStore((s) => s.isCollapsed),
		isMobileOpen: useSidebarLayoutStore((s) => s.isMobileOpen),
		isFocusMode: useSidebarLayoutStore((s) => s.isFocusMode),
		isNotificationsOpen: useSidebarLayoutStore((s) => s.isNotificationsOpen),
		setIsCollapsed: useSidebarLayoutStore((s) => s.setIsCollapsed),
		setIsMobileOpen: useSidebarLayoutStore((s) => s.setIsMobileOpen),
		setIsFocusMode: useSidebarLayoutStore((s) => s.setIsFocusMode),
		setIsNotificationsOpen: useSidebarLayoutStore((s) => s.setIsNotificationsOpen),
		toggleCollapsed: useSidebarLayoutStore((s) => s.toggleCollapsed),
		toggleMobileOpen: useSidebarLayoutStore((s) => s.toggleMobileOpen),
	};
}
