import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { globalErrorHandler } from "../../../../shared/plugins/error-handler";
import { agenticLedgerModule } from "../../index";

describe("agentic ledger routes contract envelope", () => {
	it("returns canonical envelope for body schema validation errors", async () => {
		const app = new Elysia().use(globalErrorHandler).use(agenticLedgerModule);

		const response = await app.handle(
			new Request("http://localhost/api/agentic-ledger/ingest/bank", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ connector: "normalized", transactions: [] }),
			}),
		);

		expect(response.status).toBe(422);
		expect(await response.json()).toMatchObject({
			success: false,
			error: "Validation failed",
			code: "VALIDATION_ERROR",
		});
	});
});
