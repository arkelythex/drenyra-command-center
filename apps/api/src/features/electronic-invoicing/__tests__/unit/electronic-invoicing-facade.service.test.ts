import { beforeEach, describe, expect, it, vi } from "vitest";
import { ElectronicInvoicingService } from "../../../../services/electronic-invoicing.service";
import { ElectronicInvoiceProcessorService } from "../../application/services/electronic-invoice-processor.service";
import type {
	ElectronicInvoiceData,
	ElectronicInvoiceResult,
} from "../../domain/cpe.types";

vi.mock("../../application/services/electronic-invoice-processor.service", () => ({
	ElectronicInvoiceProcessorService: {
		processElectronicInvoice: vi.fn(),
	},
}));

describe("ElectronicInvoicingService facade", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("delegates electronic invoice processing to the canonical feature processor", async () => {
		const input: ElectronicInvoiceData = {
			companyId: "cmp-1",
			transactionId: "tx-1",
			xmlContent: "<Invoice />",
			invoiceNumber: "F001-00000001",
			invoiceType: "01",
		};
		const expected: ElectronicInvoiceResult = {
			success: true,
			transactionId: "tx-1",
			status: "ACCEPTED",
			sunatCode: "0",
			sunatMessage: "ACEPTADO",
			processingTime: 120,
		};

		vi.mocked(
			ElectronicInvoiceProcessorService.processElectronicInvoice,
		).mockResolvedValue(expected);

		await expect(
			ElectronicInvoicingService.processElectronicInvoice(input),
		).resolves.toBe(expected);
		expect(
			ElectronicInvoiceProcessorService.processElectronicInvoice,
		).toHaveBeenCalledWith(input);
	});
});
