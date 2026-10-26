import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
	describeMissionError,
	MissionFailedState,
} from "../components/mission/MissionFailedState";

const PROXY_ERROR =
	"Vite could not proxy /api/v1/missions to http://localhost:3000. Start the API with `bun run --cwd apps/api dev`.";

describe("describeMissionError", () => {
	it("explains an unreachable server in user terms", () => {
		expect(describeMissionError(PROXY_ERROR).description).toMatch(
			/no pudimos conectar/i,
		);
		expect(describeMissionError("Failed to fetch").description).toMatch(
			/no pudimos conectar/i,
		);
	});

	it("falls back to a generic explanation for unknown errors", () => {
		expect(describeMissionError("boom").description).toMatch(
			/error inesperado/i,
		);
		expect(describeMissionError(null).description).toMatch(/error inesperado/i);
	});
});

describe("MissionFailedState", () => {
	it("shows a human explanation and hides the raw error behind technical details", () => {
		render(
			<MissionFailedState
				error={PROXY_ERROR}
				onRetry={vi.fn()}
				onReset={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("heading", { name: /no pudo completarse/i }),
		).toBeInTheDocument();
		expect(screen.getByText(/no pudimos conectar/i)).toBeVisible();
		expect(screen.getByText(/detalles técnicos/i)).toBeInTheDocument();
		expect(screen.getByText(PROXY_ERROR)).not.toBeVisible();
	});

	it("retries and starts a new mission from distinct actions", async () => {
		const user = userEvent.setup();
		const onRetry = vi.fn();
		const onReset = vi.fn();
		render(
			<MissionFailedState error="boom" onRetry={onRetry} onReset={onReset} />,
		);

		await user.click(screen.getByRole("button", { name: "Reintentar" }));
		await user.click(screen.getByRole("button", { name: "Nueva misión" }));
		expect(onRetry).toHaveBeenCalledOnce();
		expect(onReset).toHaveBeenCalledOnce();
	});

	it("omits technical details when there is no error message", () => {
		render(
			<MissionFailedState error={null} onRetry={vi.fn()} onReset={vi.fn()} />,
		);
		expect(screen.queryByText(/detalles técnicos/i)).not.toBeInTheDocument();
	});
});
