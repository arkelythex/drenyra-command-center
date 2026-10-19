import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatAgent } from "../ChatAgent";
import { threadStore } from "../thread-store";

describe("ChatAgent", () => {
	beforeEach(() => {
		threadStore.setActiveThread("thread-001");
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("renders the active conversation and composer", () => {
		render(<ChatAgent />);

		// The title shows in both the thread list and the conversation header.
		expect(screen.getAllByText("Bienvenida").length).toBeGreaterThanOrEqual(1);
		expect(
			screen.getByPlaceholderText("Escribí lo que necesitás..."),
		).toBeInTheDocument();
	});

	it("keeps sending disabled for blank messages", () => {
		render(<ChatAgent />);

		expect(screen.getByRole("button", { name: "Enviar" })).toBeDisabled();
	});

	it("sends an unknown request and renders the API fallback response", async () => {
		// Unmatched text falls through to the "consulta" adapter, which calls the API.
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue({
				ok: false,
				json: async () => ({ error: "Consulta no reconocida" }),
			}),
		);
		render(<ChatAgent />);
		const input = screen.getByPlaceholderText("Escribí lo que necesitás...");

		fireEvent.change(input, { target: { value: "consulta desconocida" } });
		fireEvent.keyDown(input, { key: "Enter" });

		expect(
			(await screen.findAllByText("consulta desconocida")).length,
		).toBeGreaterThanOrEqual(1);
		await waitFor(() => {
			expect(screen.getByText(/Consulta no procesada/)).toBeInTheDocument();
		});
	});
});
