import { beforeEach, describe, expect, it } from "vitest";
import { useSidebarLayoutStore } from "../sidebar-layout.store";

const initialSidebarLayoutState = {
	isCollapsed: false,
	isMobileOpen: false,
	isFocusMode: false,
	isNotificationsOpen: false,
};

describe("sidebar layout store", () => {
	beforeEach(() => {
		useSidebarLayoutStore.setState(initialSidebarLayoutState);
	});

	it("starts with the legacy sidebar layout defaults", () => {
		expect(useSidebarLayoutStore.getState()).toMatchObject(
			initialSidebarLayoutState,
		);
	});

	it("updates explicit layout flags", () => {
		const store = useSidebarLayoutStore.getState();

		store.setIsCollapsed(true);
		store.setIsMobileOpen(true);
		store.setIsFocusMode(true);
		store.setIsNotificationsOpen(true);

		expect(useSidebarLayoutStore.getState()).toMatchObject({
			isCollapsed: true,
			isMobileOpen: true,
			isFocusMode: true,
			isNotificationsOpen: true,
		});
	});

	it("toggles collapsed and mobile drawer state", () => {
		const store = useSidebarLayoutStore.getState();

		store.toggleCollapsed();
		store.toggleMobileOpen();

		expect(useSidebarLayoutStore.getState()).toMatchObject({
			isCollapsed: true,
			isMobileOpen: true,
		});

		useSidebarLayoutStore.getState().toggleCollapsed();
		useSidebarLayoutStore.getState().toggleMobileOpen();

		expect(useSidebarLayoutStore.getState()).toMatchObject({
			isCollapsed: false,
			isMobileOpen: false,
		});
	});
});
