import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useAgenticShell } from "@/stores/agentic-shell.store";
import { AgenticSidebarToggle } from "../AgenticSidebar/components/AgenticSidebarToggle";
import { MobileTopBar } from "../MobileTopBar/MobileTopBar";

beforeEach(() => {
	useAgenticShell.setState({
		isSidebarCollapsed: false,
		isSidebarMobileOpen: false,
		isCommandPaletteOpen: false,
	});
});

describe("AgenticSidebarToggle", () => {
	it("collapses and expands the desktop sidebar", async () => {
		const user = userEvent.setup();
		render(<AgenticSidebarToggle />);

		await user.click(screen.getByRole("button", { name: /contraer menú/i }));
		expect(useAgenticShell.getState().isSidebarCollapsed).toBe(true);

		await user.click(screen.getByRole("button", { name: /expandir menú/i }));
		expect(useAgenticShell.getState().isSidebarCollapsed).toBe(false);
	});

	it("closes the mobile drawer instead of collapsing when the drawer is open", async () => {
		const user = userEvent.setup();
		useAgenticShell.setState({ isSidebarMobileOpen: true });
		render(<AgenticSidebarToggle />);

		await user.click(screen.getByRole("button", { name: /cerrar menú/i }));
		expect(useAgenticShell.getState().isSidebarMobileOpen).toBe(false);
		expect(useAgenticShell.getState().isSidebarCollapsed).toBe(false);
	});
});

describe("MobileTopBar", () => {
	it("opens the navigation drawer and reports its state", async () => {
		const user = userEvent.setup();
		render(<MobileTopBar />);

		const menu = screen.getByRole("button", { name: /abrir menú/i });
		expect(menu).toHaveAttribute("aria-expanded", "false");
		expect(menu).toHaveAttribute("aria-controls", "app-sidebar");

		await user.click(menu);
		expect(useAgenticShell.getState().isSidebarMobileOpen).toBe(true);
	});

	it("opens the command palette from the search action", async () => {
		const user = userEvent.setup();
		render(<MobileTopBar />);

		await user.click(screen.getByRole("button", { name: /buscar/i }));
		expect(useAgenticShell.getState().isCommandPaletteOpen).toBe(true);
	});
});
