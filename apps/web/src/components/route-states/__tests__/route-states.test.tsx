import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		to,
		children,
		...rest
	}: {
		to: string;
		children: React.ReactNode;
	}) => (
		<a href={to} {...rest}>
			{children}
		</a>
	),
}));

import { RouteError } from "../RouteError";
import { RouteNotFound } from "../RouteNotFound";

describe("RouteError", () => {
	it("explains the failure in Spanish and lets the person retry", () => {
		const reset = vi.fn();
		render(<RouteError error={new Error("boom")} reset={reset} />);

		expect(
			screen.getByRole("heading", { level: 1, name: "Algo salió mal" }),
		).toBeInTheDocument();
		expect(screen.queryByText(/something went wrong/i)).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
		expect(reset).toHaveBeenCalledTimes(1);
	});

	it("keeps technical details out of sight until asked", () => {
		render(<RouteError error={new Error("boom")} reset={vi.fn()} />);
		expect(screen.getByText("boom")).not.toBeVisible();
	});
});

describe("RouteNotFound", () => {
	it("says the page does not exist and links back home", () => {
		render(<RouteNotFound />);
		expect(
			screen.getByRole("heading", { level: 1, name: "Página no encontrada" }),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute(
			"href",
			"/",
		);
	});
});
