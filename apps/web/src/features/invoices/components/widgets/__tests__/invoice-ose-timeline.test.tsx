import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InvoiceOseTimeline } from "../invoice-ose-timeline";

describe("InvoiceOseTimeline", () => {
	it("renders the three most recent lifecycle events in reverse chronological order", () => {
		render(
			<InvoiceOseTimeline
				timeline={[
					{
						stage: "CREATED",
						status: "DRAFT",
						source: "SYSTEM",
						at: "2026-03-01T10:00:00.000Z",
						message: "Transacción creada",
					},
					{
						stage: "SIGNED",
						status: "SUCCESS",
						source: "SYSTEM",
						at: "2026-03-01T10:05:00.000Z",
						message: "XML firmado",
					},
					{
						stage: "OSE_SUBMIT",
						status: "SUBMITTED",
						source: "SYSTEM",
						at: "2026-03-01T10:06:00.000Z",
						message: "Enviado a OSE",
					},
					{
						stage: "SUNAT_CDR",
						status: "ACCEPTED",
						source: "SUNAT",
						at: "2026-03-01T10:07:00.000Z",
						message: "CDR aceptado",
					},
				]}
			/>,
		);

		const headings = screen.getAllByText(
			(_, element) => element?.tagName.toLowerCase() === "span",
		);
		expect(headings.some((node) => node.textContent === "SUNAT_CDR")).toBe(
			true,
		);
		expect(headings.some((node) => node.textContent === "OSE_SUBMIT")).toBe(
			true,
		);
		expect(headings.some((node) => node.textContent === "SIGNED")).toBe(true);
		expect(headings.some((node) => node.textContent === "CREATED")).toBe(false);
		expect(screen.getByText("ACCEPTED")).toBeInTheDocument();
		expect(screen.getByText("SUBMITTED")).toBeInTheDocument();
		expect(screen.getByText("Actual")).toBeInTheDocument();
		expect(screen.getAllByLabelText("Estado exitoso")).toHaveLength(2);
		expect(screen.getByLabelText("Estado en proceso")).toBeInTheDocument();
		expect(screen.getAllByTestId("invoice-ose-timeline-rail")).toHaveLength(3);
		expect(screen.getAllByTestId("invoice-ose-timeline-dot")).toHaveLength(3);
		expect(screen.getByText("CDR aceptado")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /ver mas \(1\)/i }),
		).toBeInTheDocument();
	});

	it("expands older events on demand when the timeline overflows", () => {
		render(
			<InvoiceOseTimeline
				timeline={[
					{
						stage: "CREATED",
						status: "DRAFT",
						source: "SYSTEM",
						at: "2026-03-01T10:00:00.000Z",
						message: "Transacción creada",
					},
					{
						stage: "SIGNED",
						status: "SUCCESS",
						source: "SYSTEM",
						at: "2026-03-01T10:05:00.000Z",
						message: "XML firmado",
					},
					{
						stage: "OSE_SUBMIT",
						status: "SUBMITTED",
						source: "SYSTEM",
						at: "2026-03-01T10:06:00.000Z",
						message: "Enviado a OSE",
					},
					{
						stage: "SUNAT_CDR",
						status: "ACCEPTED",
						source: "SUNAT",
						at: "2026-03-01T10:07:00.000Z",
						message: "CDR aceptado",
					},
					{
						stage: "ARCHIVED",
						status: "SUCCESS",
						source: "SYSTEM",
						at: "2026-03-01T10:08:00.000Z",
						message: "Archivado",
					},
				]}
			/>,
		);

		expect(screen.queryByText("CREATED")).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: /ver mas \(2\)/i }));
		expect(screen.getByText("CREATED")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /ver menos/i }),
		).toBeInTheDocument();
	});
});
