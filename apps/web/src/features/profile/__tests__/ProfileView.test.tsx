import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ProfileView } from "../components/ProfileView";

vi.mock("@/features/settings/components/SettingsShell", () => ({ SettingsShell: ({ title, children }: { title: string; children: ReactNode }) => <main><h1>{title}</h1>{children}</main> }));
vi.mock("@/features/settings/components/SettingsPrimitives", () => ({
	SettingsSection: ({ title, children }: { title: string; children: ReactNode }) => <section><h2>{title}</h2>{children}</section>,
	SettingSwitch: ({ checked, onCheckedChange, label }: { checked: boolean; onCheckedChange: (value: boolean) => void; label: string }) => <button type="button" aria-pressed={checked} onClick={() => onCheckedChange(!checked)}>{label}</button>,
}));

describe("ProfileView", () => {
	it("renders profile identity and professional sections", () => {
		render(<ProfileView />);
		expect(screen.getByRole("heading", { name: "Mi Perfil" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Perfil Profesional" })).toBeInTheDocument();
	});

	it("updates the displayed name from the identity form", () => {
		render(<ProfileView />);
		fireEvent.change(screen.getByLabelText("Nombre completo"), { target: { value: "Ana Contadora" } });
		expect(screen.getByText("Ana Contadora")).toBeInTheDocument();
	});

	it("toggles team-directory visibility", () => {
		render(<ProfileView />);
		const toggle = screen.getByRole("button", { name: "Mostrar perfil en directorio" });
		expect(toggle).toHaveAttribute("aria-pressed", "true");
		fireEvent.click(toggle);
		expect(toggle).toHaveAttribute("aria-pressed", "false");
	});
});
