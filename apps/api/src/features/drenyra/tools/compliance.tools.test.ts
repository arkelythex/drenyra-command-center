import type { AgentContext } from "@drenyra/pi";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { calculateIgvTool } from "./compliance.tools";

const IgvCalculationResultSchema = z.object({
	base: z.string(),
	igv: z.string(),
	total: z.string(),
	baseCents: z.number().int(),
	igvCents: z.number().int(),
	totalCents: z.number().int(),
	currency: z.literal("PEN"),
	taxRateBasisPoints: z.literal(1800),
});

describe("calculateIgvTool", () => {
	it("calculates IGV from integer cents without float money input", async () => {
		const result = await calculateIgvTool.execute(
			{ amountCents: 10, currency: "PEN" },
			{} as AgentContext,
		);
		const parsed = IgvCalculationResultSchema.parse(result);

		expect(parsed).toEqual({
			base: "0.10",
			igv: "0.02",
			total: "0.12",
			baseCents: 10,
			igvCents: 2,
			totalCents: 12,
			currency: "PEN",
			taxRateBasisPoints: 1800,
		});
	});
});
