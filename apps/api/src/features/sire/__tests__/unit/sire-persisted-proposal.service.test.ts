import { describe, expect, it, vi } from "vitest";
import { parseProposalRecordsFromPayloadBase64 } from "../../services/sire-persisted-proposal.service";

describe("parseProposalRecordsFromPayloadBase64", () => {
	it("parses pipe-delimited SIRE rows from base64 payload", () => {
		const line =
			"202603|1|01/03/2026|01|F001|123|6|20123456789|PROVEEDOR SAC|100.00|18.00|118.00|PEN|1.000|1";
		const payloadBase64 = Buffer.from(`${line}\n`, "utf-8").toString("base64");

		const records = parseProposalRecordsFromPayloadBase64(
			payloadBase64,
			"COMPRAS",
		);

		expect(records).toHaveLength(1);
		expect(records[0]).toMatchObject({
			series: "F001",
			number: "123",
			total: 118,
			ruc: "20123456789",
		});
	});
});

describe("SirePersistedProposalService.loadPersistedRecords", () => {
	it("returns null when no submissions contain proposalRecords", async () => {
		vi.mock("@arkelythex/persistence/client", () => ({
			db: {
				select: vi.fn().mockReturnValue({
					from: vi.fn().mockReturnValue({
						where: vi.fn().mockReturnValue({
							orderBy: vi.fn().mockReturnValue({
								limit: vi.fn().mockResolvedValue([]),
							}),
						}),
					}),
				}),
			},
		}));

		const { SirePersistedProposalService: Service } = await import(
			"../../services/sire-persisted-proposal.service"
		);
		const result = await Service.loadPersistedRecords({
			companyId: "cmp_test",
			period: "2026-03",
		});
		expect(result).toBeNull();
	});
});
