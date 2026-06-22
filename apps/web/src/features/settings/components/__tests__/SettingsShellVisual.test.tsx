import { render, screen } from "@testing-library/react";
import { Settings } from "lucide-react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsShell } from "../SettingsShell";

const preloadRoute = vi.fn(async () => undefined);
const setIsMobileOpen = vi.fn();
let pathname = "/configuracion";

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to,
		className,
	}: {
		children: ReactNode;
		to: string;
		className?: string;
	}) => (
		<a href={to} className={className}>
			{children}
		</a>
	),
	useLocation: () => ({ pathname }),
	useRouter: () => ({ preloadRoute }),
}));

vi.mock("@/stores/sidebar-layout.store", () => ({
	useSidebarLayout: () => ({ setIsMobileOpen }),
}));

describe("SettingsShell visual system", () => {
	beforeEach(() => {
		preloadRoute.mockClear();
		setIsMobileOpen.mockClear();
		pathname = "/settings";
	});

	it("renders the unified settings workspace with header and nav destinations", () => {
		render(
			<SettingsShell
				title="Configuración General"
				description="Workspace settings"
				icon={Settings}
				badge="BASE"
			>
				<div>Settings content</div>
			</SettingsShell>,
		);

		expect(
			screen.getByRole("heading", { name: /configuración general/i }),
		).toBeInTheDocument();
		expect(screen.getByText(/workspace settings/i)).toBeInTheDocument();
		expect(screen.getByText("BASE")).toBeInTheDocument();
		expect(
			screen.getAllByRole("link", { name: /back to app/i })[0],
		).toHaveAttribute("href", "/");
		expect(
			screen.getAllByRole("link", { name: /apariencia/i })[0],
		).toHaveAttribute("href", "/configuracion/appearance");
		expect(screen.getByText(/Settings content/i)).toBeInTheDocument();
	});
});
