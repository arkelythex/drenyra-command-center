import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HeaderActivityCluster } from "../HeaderActivityCluster";

vi.mock("@/features/auth/components/UserMenu", () => ({
	UserMenu: () => <button type="button">Cuenta</button>,
}));

describe("HeaderActivityCluster", () => {
	it("opens the activity surface when the activity button is pressed", async () => {
		const user = userEvent.setup();
		const onNotificationsClick = vi.fn();

		render(
			<HeaderActivityCluster onNotificationsClick={onNotificationsClick} />,
		);

		await user.click(
			screen.getByRole("button", { name: /abrir actividad y notificaciones/i }),
		);

		expect(onNotificationsClick).toHaveBeenCalledTimes(1);
		expect(screen.getByRole("button", { name: "Cuenta" })).toBeInTheDocument();
	});
});
