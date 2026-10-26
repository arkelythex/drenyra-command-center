import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_PREFERENCE } from "@/lib/ux-mode";
import { useUIStore } from "@/stores/ui.store";
import { AppearanceSettings } from "../components/AppearanceSettings";

vi.mock("../components/SettingsShell", () => ({
	SettingsShell: ({
		title,
		children,
	}: {
		title: string;
		children: ReactNode;
	}) => (
		<main>
			<h1>{title}</h1>
			{children}
		</main>
	),
}));

beforeEach(() => {
	useUIStore.setState({
		themePreference: THEME_PREFERENCE.SYSTEM,
		accentPreference: null,
		densityPreference: null,
	});
});

describe("AppearanceSettings", () => {
	it("switches the theme preference", async () => {
		const user = userEvent.setup();
		render(<AppearanceSettings />);

		expect(screen.getByRole("radio", { name: "Sistema" })).toBeChecked();
		await user.click(screen.getByRole("radio", { name: "Oscuro" }));
		expect(useUIStore.getState().themePreference).toBe(THEME_PREFERENCE.DARK);
	});

	it("picks an accent color and can return to the theme default", async () => {
		const user = userEvent.setup();
		render(<AppearanceSettings />);

		await user.click(screen.getByRole("radio", { name: /teal/i }));
		expect(useUIStore.getState().accentPreference).toBe("teal");

		await user.click(screen.getByRole("radio", { name: /predeterminado/i }));
		expect(useUIStore.getState().accentPreference).toBeNull();
	});

	it("changes the interface density", async () => {
		const user = userEvent.setup();
		render(<AppearanceSettings />);

		await user.click(screen.getByRole("radio", { name: "Compacta" }));
		expect(useUIStore.getState().densityPreference).toBe("compact");
	});
});
