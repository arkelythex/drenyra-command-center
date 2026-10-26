import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AskError } from "@/features/ask-drenyra/ask-client";

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), streamAsk: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => mocks.navigate,
}));
vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: () => ({
		companyContext: {
			companyId: "cmp-1",
			companyName: "Andina S.A.C.",
			ruc: "20123456789",
		},
		fiscalPeriod: "2026-09",
	}),
}));
vi.mock("@/features/ask-drenyra/ask-client", async (importOriginal) => ({
	...(await importOriginal<object>()),
	streamAsk: mocks.streamAsk,
}));

import { AgenticCommandBar } from "../AgenticCommandBar/AgenticCommandBar";

async function* events(
	...items: Array<{ type: "token"; text: string } | { type: "done" }>
) {
	for (const item of items) yield item;
}

beforeEach(() => vi.clearAllMocks());

describe("AgenticCommandBar — Pregunta a Drenyra", () => {
	it("sends the question and streams the answer instead of navigating away", async () => {
		mocks.streamAsk.mockReturnValue(
			events(
				{ type: "token", text: "Vence el " },
				{ type: "token", text: "día 15." },
				{ type: "done" },
			),
		);
		const user = userEvent.setup();
		render(<AgenticCommandBar />);

		await user.type(
			screen.getByRole("textbox", { name: "Pregunta a Drenyra" }),
			"¿Cuándo vence el IGV?",
		);
		await user.click(screen.getByRole("button", { name: "Enviar" }));

		expect(await screen.findByText("Vence el día 15.")).toBeInTheDocument();
		expect(screen.getByText("¿Cuándo vence el IGV?")).toBeInTheDocument();
		expect(mocks.streamAsk).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId: "cmp-1",
				question: "¿Cuándo vence el IGV?",
			}),
		);
		expect(mocks.navigate).not.toHaveBeenCalled();
		expect(
			screen.getByRole("textbox", { name: "Pregunta a Drenyra" }),
		).toHaveValue("");
	});

	it("shows a clear message when Drenyra cannot answer", async () => {
		mocks.streamAsk.mockImplementation(async function* () {
			yield* [];
			throw new AskError(
				"unauthenticated",
				"Inicia sesión para preguntarle a Drenyra.",
			);
		});
		const user = userEvent.setup();
		render(<AgenticCommandBar />);

		await user.type(
			screen.getByRole("textbox", { name: "Pregunta a Drenyra" }),
			"hola",
		);
		await user.click(screen.getByRole("button", { name: "Enviar" }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			/inicia sesión/i,
		);
	});

	it("closes the answer panel", async () => {
		mocks.streamAsk.mockReturnValue(
			events({ type: "token", text: "Listo." }, { type: "done" }),
		);
		const user = userEvent.setup();
		render(<AgenticCommandBar />);

		await user.type(
			screen.getByRole("textbox", { name: "Pregunta a Drenyra" }),
			"hola",
		);
		await user.click(screen.getByRole("button", { name: "Enviar" }));
		await screen.findByText("Listo.");

		await user.click(screen.getByRole("button", { name: "Cerrar respuesta" }));
		expect(screen.queryByText("Listo.")).not.toBeInTheDocument();
	});
});
