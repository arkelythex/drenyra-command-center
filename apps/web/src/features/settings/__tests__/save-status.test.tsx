import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SettingsFooterActions } from "../components/settings-view/footer-actions";

describe("SettingsFooterActions (auto-save status)", () => {
	it("announces saving, saved and failed states without fake save buttons", () => {
		const { rerender } = render(
			<SettingsFooterActions isSaving error={null} />,
		);
		expect(screen.getByRole("status")).toHaveTextContent(/guardando/i);
		expect(screen.queryByRole("button")).not.toBeInTheDocument();

		rerender(<SettingsFooterActions isSaving={false} error={null} />);
		expect(screen.getByRole("status")).toHaveTextContent(
			/se guardan automáticamente/i,
		);

		rerender(
			<SettingsFooterActions isSaving={false} error={new Error("boom")} />,
		);
		expect(screen.getByRole("status")).toHaveTextContent(/no se pudo guardar/i);
	});
});
