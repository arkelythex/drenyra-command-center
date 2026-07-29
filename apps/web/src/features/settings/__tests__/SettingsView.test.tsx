import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { SettingsView } from "../components/SettingsView";

const mocks = vi.hoisted(() => ({
	setLanguage: vi.fn(), setTimezone: vi.fn(), setCurrency: vi.fn(), setCompanyName: vi.fn(), setCompanyRuc: vi.fn(), setAutoClosePeriod: vi.fn(), setShowAmountsInWords: vi.fn(),
}));
vi.mock("../hooks/use-settings-general", () => ({ useSettingsGeneral: () => ({ language: "es", timezone: "America/Lima", currency: "PEN", companyName: "Drenyra", companyRuc: "20123456789", autoClosePeriod: false, showAmountsInWords: false, ...mocks }) }));
vi.mock("../components/SettingsShell", () => ({ SettingsShell: ({ title, children }: { title: string; children: ReactNode }) => <main><h1>{title}</h1>{children}</main> }));
vi.mock("../components/settings-view/region-section", () => ({ RegionSettingsSection: ({ onLanguageChange }: { onLanguageChange: (value: string) => void }) => <button type="button" onClick={() => onLanguageChange("en")}>Cambiar idioma</button> }));
vi.mock("../components/settings-view/company-section", () => ({ CompanySettingsSection: ({ onCompanyNameChange }: { onCompanyNameChange: (value: string) => void }) => <button type="button" onClick={() => onCompanyNameChange("Nueva empresa")}>Cambiar empresa</button> }));
vi.mock("../components/settings-view/operational-section", () => ({ OperationalSettingsSection: ({ onAutoCloseChange }: { onAutoCloseChange: (value: boolean) => void }) => <button type="button" onClick={() => onAutoCloseChange(true)}>Activar cierre</button> }));
vi.mock("../components/settings-view/footer-actions", () => ({ SettingsFooterActions: () => <footer>Acciones guardadas</footer> }));

describe("SettingsView", () => {
	it("renders the general settings heading", () => { render(<SettingsView />); expect(screen.getByRole("heading", { name: "Configuración General" })).toBeInTheDocument(); });
	it("forwards language changes to its settings hook", () => { render(<SettingsView />); fireEvent.click(screen.getByText("Cambiar idioma")); expect(mocks.setLanguage).toHaveBeenCalledWith("en"); });
	it("forwards company and operational updates", () => { render(<SettingsView />); fireEvent.click(screen.getByText("Cambiar empresa")); fireEvent.click(screen.getByText("Activar cierre")); expect(mocks.setCompanyName).toHaveBeenCalledWith("Nueva empresa"); expect(mocks.setAutoClosePeriod).toHaveBeenCalledWith(true); });
});
