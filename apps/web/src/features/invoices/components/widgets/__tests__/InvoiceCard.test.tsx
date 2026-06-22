import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	useSendInvoiceOseMock,
	useInvoiceOseLifecycleMock,
	useDownloadInvoicePDFMock,
	useFinancialHapticsMock,
	writeTextMock,
	windowOpenMock,
	sendMutateMock,
	lifecycleMutateMock,
	downloadMutateMock,
} = vi.hoisted(() => ({
	useSendInvoiceOseMock: vi.fn(),
	useInvoiceOseLifecycleMock: vi.fn(),
	useDownloadInvoicePDFMock: vi.fn(),
	useFinancialHapticsMock: vi.fn(),
	writeTextMock: vi.fn(),
	windowOpenMock: vi.fn(),
	sendMutateMock: vi.fn(),
	lifecycleMutateMock: vi.fn(),
	downloadMutateMock: vi.fn(),
}));

vi.mock("@dnd-kit/core", () => ({
	useDraggable: () => ({
		attributes: {},
		listeners: {},
		setNodeRef: vi.fn(),
		transform: null,
		isDragging: false,
	}),
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("@/features/invoices/hooks/useSendInvoiceOse", () => ({
	useSendInvoiceOse: useSendInvoiceOseMock,
}));

vi.mock("@/features/invoices/hooks/useInvoiceOseLifecycle", () => ({
	useInvoiceOseLifecycle: useInvoiceOseLifecycleMock,
}));

vi.mock("@/features/invoices/hooks/usePDFActions", () => ({
	useDownloadInvoicePDF: useDownloadInvoicePDFMock,
}));

vi.mock("@/hooks/useHaptics", () => ({
	useFinancialHaptics: useFinancialHapticsMock,
	useHaptics: () => ({
		trigger: vi.fn(),
	}),
}));

vi.mock("@/components/ui/liquid-glass", () => ({
	LiquidGlassCard: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("@/features/invoices/components/DeleteInvoiceDialog", () => ({
	DeleteInvoiceDialog: () => null,
}));

vi.mock("@/features/invoices/components/EditInvoiceModal", () => ({
	EditInvoiceModal: () => null,
}));

vi.mock("@/features/invoices/components/SendEmailModal", () => ({
	SendEmailModal: () => null,
}));

vi.mock("@/features/invoices/components/PDFPreviewModal", () => ({
	PDFPreviewModal: ({
		invoiceNumber,
	}: {
		invoiceNumber: string;
	}) => <div data-testid="pdf-preview-modal-mock">{invoiceNumber}</div>,
}));

import { InvoiceCard } from "../InvoiceCard";

describe("InvoiceCard", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		useSendInvoiceOseMock.mockReturnValue({
			data: undefined,
			error: undefined,
			isPending: false,
			mutate: sendMutateMock,
		});

		useInvoiceOseLifecycleMock.mockReturnValue({
			data: undefined,
			error: undefined,
			isPending: false,
			mutate: lifecycleMutateMock,
		});

		useDownloadInvoicePDFMock.mockReturnValue({
			isPending: false,
			mutate: downloadMutateMock,
		});

		useFinancialHapticsMock.mockReturnValue({
			onSwitchTab: vi.fn(),
			onExportReport: vi.fn(),
			onInvoiceDelete: vi.fn(),
		});

		Object.defineProperty(window, "open", {
			configurable: true,
			value: windowOpenMock,
		});

		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: {
				writeText: writeTextMock,
			},
		});

		writeTextMock.mockResolvedValue(undefined);
	});

	it("exposes ticket and traceability actions from the card surface", async () => {
		render(
			<InvoiceCard
				invoice={{
					id: "inv-1",
					customer: {
						name: "Comercial Uno SAC",
						initials: "CO",
						email: "billing@uno.pe",
					},
					amount: 118,
					totalAmount: 118,
					invoiceNumber: "F001-00000001",
					dueDate: "2026-03-15",
					status: "sent",
					currency: "PEN",
					sunatCdr: "https://ose.example.test/cdr/F001-00000001.zip",
					sunatTicket: "TKT-2026-000001",
				}}
				isSent
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /copiar ticket/i }));
		fireEvent.click(screen.getByRole("button", { name: /ver trazabilidad/i }));

		await waitFor(() => {
			expect(writeTextMock).toHaveBeenCalledWith("TKT-2026-000001");
		});

		expect(lifecycleMutateMock).toHaveBeenCalledWith("inv-1");
	});

	it("lazy-loads the PDF preview modal from the action menu", async () => {
		render(
			<InvoiceCard
				invoice={{
					id: "inv-2",
					customer: {
						name: "Servicios Dos SAC",
						initials: "SD",
						email: "billing@dos.pe",
					},
					amount: 236,
					totalAmount: 236,
					invoiceNumber: "F001-00000002",
					dueDate: "2026-03-20",
					status: "sent",
					currency: "PEN",
				}}
				isSent
			/>,
		);

		fireEvent.pointerDown(screen.getAllByRole("button")[0], {
			button: 0,
			ctrlKey: false,
		});
		fireEvent.click(await screen.findByRole("menuitem", { name: /vista previa pdf/i }));

		expect(await screen.findByTestId("pdf-preview-modal-mock")).toHaveTextContent(
			"F001-00000002",
		);
	});
});
