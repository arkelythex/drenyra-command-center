import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ChatAgent } from "../ChatAgent";
import { threadStore } from "../thread-store";

describe("ChatAgent", () => {
	beforeEach(() => {
		threadStore.setActiveThread("thread-001");
	});

	it("renders the active conversation and composer", () => {
		render(<ChatAgent />);

		expect(screen.getByText("Bienvenida")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("Escribí lo que necesitás...")).toBeInTheDocument();
	});

	it("keeps sending disabled for blank messages", () => {
		render(<ChatAgent />);

		expect(screen.getByRole("button", { name: "Enviar" })).toBeDisabled();
	});

	it("sends an unknown request and renders the fallback response", async () => {
		render(<ChatAgent />);
		const input = screen.getByPlaceholderText("Escribí lo que necesitás...");

		fireEvent.change(input, { target: { value: "consulta desconocida" } });
		fireEvent.keyDown(input, { key: "Enter" });

		expect(await screen.findByText("consulta desconocida")).toBeInTheDocument();
		await waitFor(() => {
			expect(screen.getByText(/No entendí tu consulta/)).toBeInTheDocument();
		});
	});
});
