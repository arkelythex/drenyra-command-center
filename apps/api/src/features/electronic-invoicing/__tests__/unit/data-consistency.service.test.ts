import { beforeEach, describe, expect, it, vi } from "vitest";
import { SunatService } from "../../../../services/sunat.service";
import { DataConsistencyService } from "../../application/services/data-consistency.service";
import type {
	TransactionConsistencyRecord,
	ValidatedXmlInvoiceData,
} from "../../domain/cpe.types";
import { CpeRepository } from "../../infrastructure/cpe.repository";

vi.mock("../../infrastructure/cpe.repository", () => ({
	CpeRepository: {
		findBusinessPartnerById: vi.fn(),
	},
}));

vi.mock("../../../../services/sunat.service", () => ({
	SunatService: {
		isValidRucFormat: vi.fn(),
	},
}));

const mockFindPartner = CpeRepository.findBusinessPartnerById as ReturnType<
	typeof vi.fn
>;
const mockIsValidRuc = SunatService.isValidRucFormat as ReturnType<
	typeof vi.fn
>;

describe("DataConsistencyService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("verify", () => {
		it("passes when RUC and amounts match within tolerance", async () => {
			mockFindPartner.mockResolvedValue({ taxId: "20601234567" });
			mockIsValidRuc.mockReturnValue(true);

			const transaction: TransactionConsistencyRecord = {
				totalAmount: "1180.00",
				partnerId: "bp-1",
			};
			const xmlData: ValidatedXmlInvoiceData = {
				ruc: "20601234567",
				totalAmount: 1180.0,
				invoice: {},
			};

			await expect(
				DataConsistencyService.verify(transaction, xmlData),
			).resolves.toBeUndefined();
		});

		it("throws when RUC does not match partner taxId", async () => {
			mockFindPartner.mockResolvedValue({ taxId: "20601234567" });

			const transaction: TransactionConsistencyRecord = {
				totalAmount: "1180.00",
				partnerId: "bp-1",
			};
			const xmlData: ValidatedXmlInvoiceData = {
				ruc: "20999999999",
				totalAmount: 1180.0,
				invoice: {},
			};

			await expect(
				DataConsistencyService.verify(transaction, xmlData),
			).rejects.toThrow("Inconsistencia de RUC");
		});

		it("throws when amount difference exceeds 0.01 tolerance", async () => {
			mockFindPartner.mockResolvedValue({ taxId: "20601234567" });
			mockIsValidRuc.mockReturnValue(true);

			const transaction: TransactionConsistencyRecord = {
				totalAmount: "1180.00",
				partnerId: "bp-1",
			};
			const xmlData: ValidatedXmlInvoiceData = {
				ruc: "20601234567",
				totalAmount: 1200.0,
				invoice: {},
			};

			await expect(
				DataConsistencyService.verify(transaction, xmlData),
			).rejects.toThrow("Inconsistencia de montos");
		});

		it("passes when amount difference is within 0.01 rounding tolerance", async () => {
			mockFindPartner.mockResolvedValue({ taxId: "20601234567" });
			mockIsValidRuc.mockReturnValue(true);

			const transaction: TransactionConsistencyRecord = {
				totalAmount: "1180.00",
				partnerId: "bp-1",
			};
			const xmlData: ValidatedXmlInvoiceData = {
				ruc: "20601234567",
				totalAmount: 1180.01,
				invoice: {},
			};

			await expect(
				DataConsistencyService.verify(transaction, xmlData),
			).resolves.toBeUndefined();
		});

		it("throws when RUC format is invalid per Módulo 11", async () => {
			mockFindPartner.mockResolvedValue(null);
			mockIsValidRuc.mockReturnValue(false);

			const transaction: TransactionConsistencyRecord = {
				totalAmount: "1180.00",
				partnerId: "bp-1",
			};
			const xmlData: ValidatedXmlInvoiceData = {
				ruc: "20123456789",
				totalAmount: 1180.0,
				invoice: {},
			};

			await expect(
				DataConsistencyService.verify(transaction, xmlData),
			).rejects.toThrow("Inconsistencia de RUC");
		});

		it("throws when xmlData.ruc is undefined but partner has taxId", async () => {
			mockFindPartner.mockResolvedValue({ taxId: "20601234567" });

			const transaction: TransactionConsistencyRecord = {
				totalAmount: "1180.00",
				partnerId: "bp-1",
			};
			const xmlData: ValidatedXmlInvoiceData = {
				totalAmount: 1180.0,
				invoice: {},
			};

			await expect(
				DataConsistencyService.verify(transaction, xmlData),
			).rejects.toThrow("Inconsistencia de RUC");
		});

		it("passes when both xmlData.ruc and partner taxId are undefined", async () => {
			mockFindPartner.mockResolvedValue(null);
			mockIsValidRuc.mockReturnValue(true);

			const transaction: TransactionConsistencyRecord = {
				totalAmount: "1180.00",
				partnerId: "bp-1",
			};
			const xmlData: ValidatedXmlInvoiceData = {
				totalAmount: 1180.0,
				invoice: {},
			};

			await expect(
				DataConsistencyService.verify(transaction, xmlData),
			).resolves.toBeUndefined();
			expect(mockIsValidRuc).not.toHaveBeenCalled();
		});

		it("skips partner lookup when partnerId is null", async () => {
			mockIsValidRuc.mockReturnValue(true);

			const transaction: TransactionConsistencyRecord = {
				totalAmount: "1180.00",
				partnerId: null,
			};
			const xmlData: ValidatedXmlInvoiceData = {
				ruc: "20601234567",
				totalAmount: 1180.0,
				invoice: {},
			};

			await expect(
				DataConsistencyService.verify(transaction, xmlData),
			).rejects.toThrow("Inconsistencia de RUC");
			expect(mockFindPartner).not.toHaveBeenCalled();
		});
	});
});
