import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsProvider } from "@/context/SettingsContext";
import { AppearanceSettings } from "@/features/settings/components/AppearanceSettings";
import { useUIStore } from "@/store/ui-store";

vi.mock("@/features/settings/components/SettingsShell", () => ({
	SettingsShell: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("@/features/settings/components/SettingsPrimitives", () => ({
	SettingsSection: ({ children }: { children: ReactNode }) => (
		<section>{children}</section>
	),
	SettingsRow: ({
		title,
		description,
		action,
	}: {
		title: string;
		description?: string;
		action: ReactNode;
	}) => (
		<div>
			<p>{title}</p>
			{description ? <p>{description}</p> : null}
			{action}
		</div>
	),
	SettingSwitch: ({
		checked,
		onCheckedChange,
		label,
	}: {
		checked: boolean;
		onCheckedChange: (checked: boolean) => void;
		label: string;
	}) => (
		<button
			type="button"
			aria-pressed={checked}
			onClick={() => onCheckedChange(!checked)}
		>
			{label}
		</button>
	),
}));

function wrapper({ children }: { children: ReactNode }) {
	return <SettingsProvider>{children}</SettingsProvider>;
}

describe("AppearanceSettings theme selection", () => {
	beforeEach(() => {
		window.localStorage.clear();
		useUIStore.setState({
			themePreference: "mono-dark",
			customThemePackage: null,
			complexityLevel: "advanced",
			isSidebarOpen: true,
			isRightRailOpen: false,
		});
	});

	it("allows selecting Light theme and bridges to ui-store", async () => {
		const user = userEvent.setup();
		render(<AppearanceSettings />, { wrapper });

		await user.click(screen.getByRole("button", { name: /light/i }));

		expect(useUIStore.getState().themePreference).toBe("mono-light");

		await waitFor(() => {
			const persisted = window.localStorage.getItem("drenyra-ui-storage");
			expect(persisted).toContain('"themePreference":"mono-light"');
		});
	});

	it("allows selecting Dark theme and bridges to ui-store", async () => {
		const user = userEvent.setup();
		render(<AppearanceSettings />, { wrapper });

		await user.click(screen.getByRole("button", { name: /dark/i }));

		expect(useUIStore.getState().themePreference).toBe("mono-dark");

		await waitFor(() => {
			const persisted = window.localStorage.getItem("drenyra-ui-storage");
			expect(persisted).toContain('"themePreference":"mono-dark"');
		});
	});

	it("allows selecting System theme and bridges to ui-store", async () => {
		const user = userEvent.setup();
		render(<AppearanceSettings />, { wrapper });

		await user.click(screen.getByRole("button", { name: /system/i }));

		expect(useUIStore.getState().themePreference).toBe("system");

		await waitFor(() => {
			const persisted = window.localStorage.getItem("drenyra-ui-storage");
			expect(persisted).toContain('"themePreference":"system"');
		});
	});

	it("persists theme selection in settings storage", async () => {
		const user = userEvent.setup();
		render(<AppearanceSettings />, { wrapper });

		await user.click(screen.getByRole("button", { name: /light/i }));

		await waitFor(() => {
			const settings = window.localStorage.getItem("drenyra-settings");
			expect(settings).toContain('"theme":"light"');
		});
	});

	it("shows correct label based on active theme", async () => {
		render(<AppearanceSettings />, { wrapper });

		await waitFor(() => {
			expect(screen.getByText(/tema oscuro/i)).toBeInTheDocument();
		});
	});
});
