import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InvoiceOseArtifacts } from "../invoice-ose-artifacts";

describe("InvoiceOseArtifacts", () => {
	it("renders persisted artifacts and lifecycle details", () => {
		const onOpenCdr = vi.fn();
		const onCopyTicket = vi.fn();
		const onLoadLifecycle = vi.fn();
		const onOpenRunbook = vi.fn();

		render(
			<InvoiceOseArtifacts
				hasPersistedCdr
				cdrUrl="https://ose.example.test/cdr/F001-1.zip"
				persistedTicket="TKT-2026-000001"
				persistedSunatStatus="ACCEPTED"
				persistedSunatCode="0"
				persistedSunatIncidentMessage={null}
				lifecycle={{
					transactionId: "tx-1",
					invoiceNumber: "F001-1",
					currentStatus: "ACCEPTED",
					sunatCode: "0",
					sunatMessage: "CDR aceptado",
					runbook: {
						id: "RB-CPE-INCIDENT-2026-02",
						path: "docs/09-troubleshooting/cpe-compliance-incidents-runbook-2026.md",
					},
					timeline: [
						{
							stage: "OSE_SUBMIT",
							status: "SUBMITTED",
							source: "SYSTEM",
							at: "2026-03-01T10:05:00.000Z",
							message: "Enviado a OSE",
						},
						{
							stage: "SUNAT_CDR",
							status: "ACCEPTED",
							source: "SUNAT",
							at: "2026-03-01T10:06:00.000Z",
							message: "CDR aceptado",
						},
					],
				}}
				isLifecyclePending={false}
				onOpenCdr={onOpenCdr}
				onCopyTicket={onCopyTicket}
				onLoadLifecycle={onLoadLifecycle}
				onOpenRunbook={onOpenRunbook}
			/>,
		);

		expect(screen.getByText("CDR disponible")).toBeInTheDocument();
		expect(screen.getByText("Aceptado")).toBeInTheDocument();
		expect(screen.getByText("Ticket TKT-2026-000001")).toBeInTheDocument();
		expect(screen.getByText("SUNAT ACCEPTED")).toBeInTheDocument();
		expect(screen.getByText("CODIGO 0")).toBeInTheDocument();
		expect(screen.getByText("Estado Aceptado")).toBeInTheDocument();
		expect(screen.getByText("Transacción tx-1")).toBeInTheDocument();
		expect(screen.getByText("SUNAT 0")).toBeInTheDocument();
		expect(
			screen.getByText("Runbook RB-CPE-INCIDENT-2026-02"),
		).toBeInTheDocument();
		expect(screen.getAllByText("SUNAT_CDR")[0]).toBeInTheDocument();
		expect(screen.getAllByText("CDR aceptado")).toHaveLength(2);

		fireEvent.click(screen.getByRole("button", { name: /abrir cdr/i }));
		fireEvent.click(screen.getByRole("button", { name: /copiar ticket/i }));
		fireEvent.click(screen.getByRole("button", { name: /ver trazabilidad/i }));
		fireEvent.click(screen.getByRole("button", { name: /abrir runbook/i }));

		expect(onOpenCdr).toHaveBeenCalledTimes(1);
		expect(onCopyTicket).toHaveBeenCalledTimes(1);
		expect(onLoadLifecycle).toHaveBeenCalledTimes(1);
		expect(onOpenRunbook).toHaveBeenCalledTimes(1);
	});

	it("renders a persisted incident summary only for non-accepted states", () => {
		render(
			<InvoiceOseArtifacts
				hasPersistedCdr
				cdrUrl={null}
				persistedTicket={null}
				persistedSunatStatus="REJECTED"
				persistedSunatCode="2320"
				persistedSunatIncidentMessage="RUC emisor inválido"
				isLifecyclePending={false}
				onOpenCdr={vi.fn()}
				onCopyTicket={vi.fn()}
				onLoadLifecycle={vi.fn()}
			/>,
		);

		expect(screen.getByText("Incidente SUNAT")).toBeInTheDocument();
		expect(screen.getByText("Rechazado")).toBeInTheDocument();
		expect(screen.getByText("RUC emisor inválido")).toBeInTheDocument();
	});
});
