import { afterEach, describe, expect, it, vi } from "vitest";
import { taxRateProviderService } from "../../../taxation/application/services/tax-rate-provider.service";
import { CreateInterCompanyTransactionHandler } from "../../application/commands/create-inter-company-transaction.handler";
import type { CreateInterCompanyTransactionInput } from "../../domain/inter-company-transaction.entity";
import type { IInterCompanyTransactionRepository } from "../../domain/inter-company-transaction.repository";

const repository: Pick<
	IInterCompanyTransactionRepository,
	"validateSameGroup" | "createAtomic"
> = {
	validateSameGroup: vi.fn(),
	createAtomic: vi.fn(),
} as unknown as IInterCompanyTransactionRepository;

const createHandler = () =>
	new CreateInterCompanyTransactionHandler(repository);

afterEach(() => {
	vi.restoreAllMocks();
	vi.clearAllMocks();
});

describe("CreateInterCompanyTransactionHandler", () => {
	const baseResult = {
		interCompany: { id: "ic-1" },
		expense: { id: "expense-1" },
		income: { id: "income-1" },
		calculations: {
			subtotal: 0,
			igv: 0,
			total: 0,
			hasDetraction: false,
			detraction: null,
			detractionRate: null,
			detractionProfile: null,
			detractionRuleCode: null,
		},
	};

	it("calculates taxes when taxType is GRAVADO and persists the atomic transaction", async () => {
		const vatRateSpy = vi
			.spyOn(taxRateProviderService, "getVatRate")
			.mockResolvedValue(0.18);
		const spotConfigSpy = vi
			.spyOn(taxRateProviderService, "getSpotDetractionConfig")
			.mockResolvedValue({
				rate: 0.04,
				thresholdCents: 0,
				source: "RULE",
				profile: "TRANSPORT",
				ruleCode: "DETRACCION_SPOT_TRANSPORT",
				effectiveDate: "2026-02-21",
			} as never);

		(repository.createAtomic as ReturnType<typeof vi.fn>).mockResolvedValue(
			baseResult,
		);
		(
			repository.validateSameGroup as ReturnType<typeof vi.fn>
		).mockResolvedValue(undefined);

		const handler = createHandler();
		const input: CreateInterCompanyTransactionInput = {
			economicGroupId: "group-1",
			fromCompanyId: "company-a",
			toCompanyId: "company-b",
			concept: "Préstamo",
			amount: 1000,
			taxType: "GRAVADO",
			detractionProfile: "TRANSPORT",
		};

		const result = await handler.execute(input);

		expect(vatRateSpy).toHaveBeenCalled();
		expect(spotConfigSpy).toHaveBeenCalled();
		expect(repository.validateSameGroup).toHaveBeenCalledWith(
			"company-a",
			"company-b",
			"group-1",
		);
		expect(repository.createAtomic).toHaveBeenCalledWith({
			economicGroupId: "group-1",
			fromCompanyId: "company-a",
			toCompanyId: "company-b",
			concept: "Préstamo",
			amount: 1000,
			taxType: "GRAVADO",
			calculations: expect.objectContaining({
				subtotal: 1000,
				igv: 180,
				total: 1180,
				hasDetraction: true,
				detraction: 47.2,
				detractionProfile: "TRANSPORT",
				detractionRuleCode: "DETRACCION_SPOT_TRANSPORT",
				detractionRate: 4,
			}),
			detractionProfile: "TRANSPORT",
		});
		expect(result).toBe(baseResult);
	});

	it("returns calculations without tax when taxType is EXONERADO", async () => {
		const vatRateSpy = vi.spyOn(taxRateProviderService, "getVatRate");
		const spotConfigSpy = vi.spyOn(
			taxRateProviderService,
			"getSpotDetractionConfig",
		);

		(repository.createAtomic as ReturnType<typeof vi.fn>).mockResolvedValue(
			baseResult,
		);
		(
			repository.validateSameGroup as ReturnType<typeof vi.fn>
		).mockResolvedValue(undefined);

		const handler = createHandler();
		const input: CreateInterCompanyTransactionInput = {
			economicGroupId: "group-1",
			fromCompanyId: "company-a",
			toCompanyId: "company-b",
			concept: "Venta interna",
			amount: 500,
			taxType: "EXONERADO",
		};

		await handler.execute(input);

		expect(vatRateSpy).not.toHaveBeenCalled();
		expect(spotConfigSpy).not.toHaveBeenCalled();
		expect(repository.createAtomic).toHaveBeenCalledWith(
			expect.objectContaining({
				calculations: expect.objectContaining({
					subtotal: 500,
					igv: 0,
					total: 500,
					hasDetraction: false,
					detraction: null,
					detractionProfile: null,
				}),
			}),
		);
	});
});
