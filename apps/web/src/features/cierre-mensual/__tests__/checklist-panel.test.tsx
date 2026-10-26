import type { CierreMensualChecklistItem } from "@drenyra/domain";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChecklistPanel } from "../components/ChecklistPanel";

const item = (
	orden: number,
	over: Partial<CierreMensualChecklistItem> = {},
): CierreMensualChecklistItem =>
	({
		id: `item-${orden}`,
		orden,
		label: `Paso ${orden} label`,
		descripcion: `Descripción ${orden}`,
		completado: false,
		requiereEvidencia: false,
		...over,
	}) as CierreMensualChecklistItem;

describe("ChecklistPanel", () => {
	it("lists the steps in order without reordering the caller's array", () => {
		const checklist = [item(3), item(1), item(2)];
		render(<ChecklistPanel checklist={checklist} />);

		const rows = within(
			screen.getByRole("list", { name: /checklist de cierre/i }),
		).getAllByRole("listitem");
		expect(rows.map((row) => row.textContent)).toEqual([
			expect.stringContaining("Paso 1 label"),
			expect.stringContaining("Paso 2 label"),
			expect.stringContaining("Paso 3 label"),
		]);
		expect(checklist.map((entry) => entry.orden)).toEqual([3, 1, 2]);
	});

	it("marks the first pending step as next and says each state in words", () => {
		render(
			<ChecklistPanel
				checklist={[item(1, { completado: true }), item(2), item(3)]}
			/>,
		);

		const rows = screen.getAllByRole("listitem");
		expect(rows[0]).toHaveTextContent("Completado");
		expect(rows[1]).toHaveTextContent("Siguiente");
		expect(rows[1]).toHaveAttribute("aria-current", "step");
		expect(rows[2]).toHaveTextContent("Pendiente");
		expect(rows[2]).not.toHaveAttribute("aria-current");
	});

	it("asks for evidence only on steps that are not done", () => {
		render(
			<ChecklistPanel
				checklist={[
					item(1, { completado: true, requiereEvidencia: true }),
					item(2, { requiereEvidencia: true }),
				]}
			/>,
		);

		expect(screen.getAllByText("Requiere evidencia adjunta")).toHaveLength(1);
	});
});
