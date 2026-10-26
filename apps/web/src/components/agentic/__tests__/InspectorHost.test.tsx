import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useAgenticShell } from "@/stores/agentic-shell.store";
import { InspectorHost } from "../InspectorHost";

afterEach(() => {
	act(() => useAgenticShell.getState().closeInspector());
});

const open = () =>
	act(() =>
		useAgenticShell.getState().openInspector({
			type: "evidence",
			id: "ev-9",
			title: "Libro de ventas",
		}),
	);

describe("InspectorHost", () => {
	it("renders nothing until something is inspected", () => {
		const { container } = render(<InspectorHost />);
		expect(container).toBeEmptyDOMElement();
	});

	it("opens as a named dialog with the subject in Spanish", async () => {
		render(<InspectorHost />);
		open();

		const dialog = await screen.findByRole("dialog", {
			name: "Libro de ventas",
		});
		expect(dialog).toHaveTextContent("Evidencia");
		expect(dialog).toHaveTextContent("ev-9");
	});

	it("closes with the button, the backdrop and Escape", async () => {
		render(<InspectorHost />);

		open();
		fireEvent.click(
			await screen.findByRole("button", { name: "Cerrar panel" }),
		);
		expect(useAgenticShell.getState().activeInspector).toBeNull();

		open();
		fireEvent.click(await screen.findByTestId("inspector-backdrop"));
		expect(useAgenticShell.getState().activeInspector).toBeNull();

		open();
		await screen.findByRole("dialog");
		fireEvent.keyDown(document, { key: "Escape" });
		expect(useAgenticShell.getState().activeInspector).toBeNull();
	});
});
