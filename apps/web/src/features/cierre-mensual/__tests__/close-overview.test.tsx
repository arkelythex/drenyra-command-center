import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClosePhaseStrip } from "../components/ClosePhaseStrip";
import { ProgressHeader } from "../components/ProgressHeader";
import { TaxReviewGate } from "../components/TaxReviewGate";

describe("ProgressHeader", () => {
	const base = {
		companyName: "Andina S.A.C.",
		companyRuc: "20123456789",
		periodo: "2026-09",
	};

	it("names the company, RUC and period under a single page title", () => {
		render(
			<ProgressHeader
				{...base}
				completedCount={0}
				totalCount={0}
				progress={0}
			/>,
		);

		expect(
			screen.getByRole("heading", { level: 1, name: "Cierre mensual" }),
		).toBeInTheDocument();
		expect(screen.getByText(/Andina S\.A\.C\./)).toBeInTheDocument();
		expect(screen.getByText(/RUC 20123456789/)).toBeInTheDocument();
		expect(screen.getByText(/2026-09/)).toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: /cambiar empresa/i }),
		).not.toBeInTheDocument();
	});

	it("shows no progress when there are no tasks, instead of an empty 0%", () => {
		render(
			<ProgressHeader
				{...base}
				completedCount={0}
				totalCount={0}
				progress={0}
			/>,
		);

		expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
		expect(screen.queryByText(/0%/)).not.toBeInTheDocument();
	});

	it("exposes real progress as an accessible progress bar", () => {
		render(
			<ProgressHeader
				{...base}
				completedCount={3}
				totalCount={12}
				progress={0.25}
			/>,
		);

		const bar = screen.getByRole("progressbar", { name: /avance del cierre/i });
		expect(bar).toHaveAttribute("aria-valuenow", "25");
		expect(screen.getByText("3 de 12 tareas")).toBeInTheDocument();
	});
});

describe("ClosePhaseStrip", () => {
	const phases = [
		{ name: "Importación", state: "completed" as const },
		{ name: "Validación", state: "active" as const },
		{
			name: "Conciliación",
			state: "blocked" as const,
			blocker: "Faltan 3 comprobantes",
		},
		{ name: "Revisión", state: "pending" as const },
	];

	it("lists the phases in order and marks the current one", () => {
		render(<ClosePhaseStrip phases={phases} activeIndex={1} />);

		const list = screen.getByRole("list", { name: "Fases del cierre" });
		const items = within(list).getAllByRole("listitem");
		expect(items.map((item) => item.textContent)).toEqual([
			expect.stringContaining("Importación"),
			expect.stringContaining("Validación"),
			expect.stringContaining("Conciliación"),
			expect.stringContaining("Revisión"),
		]);
		expect(items[1]).toHaveAttribute("aria-current", "step");
		expect(items[0]).not.toHaveAttribute("aria-current");
		expect(screen.getByText(/fase activa: validación/i)).toBeInTheDocument();
	});

	it("states each phase in words, not by color alone", () => {
		render(<ClosePhaseStrip phases={phases} activeIndex={1} />);

		expect(screen.getByText("Completada")).toBeInTheDocument();
		expect(screen.getByText("En curso")).toBeInTheDocument();
		expect(screen.getByText("Bloqueada")).toBeInTheDocument();
		expect(screen.getByText("Pendiente")).toBeInTheDocument();
	});

	it("surfaces the blocker of a blocked phase and never invents evidence counts", () => {
		const { container } = render(
			<ClosePhaseStrip phases={phases} activeIndex={1} />,
		);

		expect(screen.getByText("Faltan 3 comprobantes")).toBeInTheDocument();
		expect(container.textContent).not.toMatch(/\d+ ev\./);
	});

	it("explains an empty close instead of rendering nothing", () => {
		render(<ClosePhaseStrip phases={[]} activeIndex={0} />);
		expect(screen.getByText(/no hay fases de cierre/i)).toBeInTheDocument();
	});
});

describe("TaxReviewGate", () => {
	const items = [
		{ id: "igv", label: "IGV del período", status: "warning" as const },
		{ id: "plame", label: "PLAME", status: "blocked" as const },
		{
			id: "firmas",
			label: "Firmas requeridas",
			status: "warning" as const,
			detail: "0 de 1 firma(s).",
		},
	];

	it("shows the verdict and the common note once, not per control", () => {
		render(
			<TaxReviewGate
				period="2026-09"
				items={items}
				verdict="attention"
				summary="Ningún control tiene evidencia de la misión todavía."
			/>,
		);

		expect(
			screen.getByRole("heading", {
				name: /revisión previa a la declaración/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText(/requiere atención antes de declarar/i),
		).toBeInTheDocument();
		expect(
			screen.getAllByText(
				"Ningún control tiene evidencia de la misión todavía.",
			),
		).toHaveLength(1);
	});

	it("lists every control with its status in words and keeps specific details", () => {
		render(<TaxReviewGate period="2026-09" items={items} verdict="blocked" />);

		const list = screen.getByRole("list", { name: /controles/i });
		const rows = within(list).getAllByRole("listitem");
		expect(rows).toHaveLength(3);
		expect(rows[0]).toHaveTextContent("IGV del período");
		expect(rows[0]).toHaveTextContent("Atención");
		expect(rows[1]).toHaveTextContent("Bloqueado");
		expect(rows[2]).toHaveTextContent("0 de 1 firma(s).");
	});

	it("never says verified without evidence", () => {
		render(
			<TaxReviewGate period="2026-09" items={items} verdict="attention" />,
		);
		expect(screen.queryByText("Verificado")).not.toBeInTheDocument();
	});
});
