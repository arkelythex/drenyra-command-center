import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type FiscalRiskAlert, FiscalRiskLayer } from "../FiscalRiskLayer";

const alert = (
	id: string,
	riskLevel: FiscalRiskAlert["riskLevel"],
	over: Partial<FiscalRiskAlert> = {},
): FiscalRiskAlert => ({
	id,
	title: `Alerta ${id}`,
	riskLevel,
	...over,
});

describe("FiscalRiskLayer", () => {
	it("renders only its children when there are no alerts", () => {
		render(
			<FiscalRiskLayer alerts={[]} overallRisk="LOW">
				<p>Contenido</p>
			</FiscalRiskLayer>,
		);

		expect(screen.getByText("Contenido")).toBeInTheDocument();
		expect(
			screen.queryByRole("list", { name: /alertas fiscales/i }),
		).not.toBeInTheDocument();
		expect(screen.queryByRole("status")).not.toBeInTheDocument();
	});

	it("summarizes alerts by level with correct Spanish plurals", () => {
		render(
			<FiscalRiskLayer
				alerts={[
					alert("a", "CRITICAL"),
					alert("b", "HIGH"),
					alert("c", "HIGH"),
					alert("d", "MEDIUM"),
				]}
				overallRisk="CRITICAL"
			>
				<p>x</p>
			</FiscalRiskLayer>,
		);

		const summary = screen.getByRole("status");
		expect(summary).toHaveTextContent("4 alertas");
		expect(summary).toHaveTextContent("1 crítico");
		expect(summary).toHaveTextContent("2 altos");
		expect(summary).toHaveTextContent("1 medio");
		expect(summary).not.toHaveTextContent(/bajo/);
	});

	it("uses the singular for a single alert", () => {
		render(
			<FiscalRiskLayer alerts={[alert("a", "LOW")]}>
				<p>x</p>
			</FiscalRiskLayer>,
		);
		expect(screen.getByRole("status")).toHaveTextContent("1 alerta");
		expect(screen.getByRole("status")).not.toHaveTextContent("1 alertas");
	});

	it("lists each alert with its level in words", () => {
		render(
			<FiscalRiskLayer
				alerts={[
					alert("a", "HIGH", { description: "Faltan guías de remisión" }),
					alert("b", "LOW"),
				]}
			>
				<p>x</p>
			</FiscalRiskLayer>,
		);

		const rows = within(
			screen.getByRole("list", { name: /alertas fiscales/i }),
		).getAllByRole("listitem");
		expect(rows[0]).toHaveTextContent("Alerta a");
		expect(rows[0]).toHaveTextContent("Alto");
		expect(rows[0]).toHaveTextContent("Faltan guías de remisión");
		expect(rows[1]).toHaveTextContent("Bajo");
	});

	it("offers an alert's action as a real link, not a scripted navigation", () => {
		render(
			<FiscalRiskLayer
				alerts={[
					alert("a", "MEDIUM", {
						actionLabel: "Ver comprobantes",
						actionTo: "/invoices",
					}),
				]}
			>
				<p>x</p>
			</FiscalRiskLayer>,
		);

		expect(
			screen.getByRole("link", { name: /ver comprobantes/i }),
		).toHaveAttribute("href", "/invoices");
	});

	it("shows no action when the alert has a label but nowhere to go", () => {
		render(
			<FiscalRiskLayer
				alerts={[alert("a", "MEDIUM", { actionLabel: "Ver comprobantes" })]}
			>
				<p>x</p>
			</FiscalRiskLayer>,
		);
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});
});
