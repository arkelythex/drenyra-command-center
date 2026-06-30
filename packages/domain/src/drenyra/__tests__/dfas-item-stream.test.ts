import { describe, expect, it } from "vitest";
import {
	assertMonotonicSequence,
	createDfasItemStreamEntry,
	DfasItemStreamValidationError,
	maxItemSequence,
} from "../dfas-item-stream";
import { DFAS_ITEM_TYPE } from "../dfas-protocol-types";
import type { DrenyraFiscalScope } from "../types";

const scope: DrenyraFiscalScope = {
	organizationId: "org-1",
	companyId: "cmp-1",
	companyRuc: "20123456786",
	period: "2026-05",
	countryCode: "PE",
};

describe("dfas-item-stream", () => {
	it("creates a valid item stream entry", () => {
		const entry = createDfasItemStreamEntry({
			id: "item-1",
			threadId: "thread-1",
			turnId: "turn-1",
			sequence: 0,
			itemType: DFAS_ITEM_TYPE.USER_MESSAGE,
			fiscalScope: scope,
			payload: { text: "hello" },
			traceId: "trace-1",
		});
		expect(entry.protocolVersion).toBe("1.0.0");
		expect(entry.itemType).toBe("user_message");
	});

	it("throws on invalid scope", () => {
		expect(() =>
			createDfasItemStreamEntry({
				id: "item-1",
				threadId: "thread-1",
				sequence: 0,
				itemType: DFAS_ITEM_TYPE.ERROR,
				fiscalScope: { ...scope, companyRuc: "bad" },
				payload: { code: "ERR", message: "fail", recoverable: false },
			}),
		).toThrow(DfasItemStreamValidationError);
	});

	it("asserts monotonic sequence", () => {
		const a = createDfasItemStreamEntry({
			id: "a",
			threadId: "t",
			sequence: 0,
			itemType: DFAS_ITEM_TYPE.USER_MESSAGE,
			fiscalScope: scope,
			payload: { text: "a" },
		});
		const b = createDfasItemStreamEntry({
			id: "b",
			threadId: "t",
			sequence: 1,
			itemType: DFAS_ITEM_TYPE.ASSISTANT_MESSAGE,
			fiscalScope: scope,
			payload: { text: "b" },
		});
		expect(() => assertMonotonicSequence([a, b])).not.toThrow();
		expect(() => assertMonotonicSequence([b, a])).toThrow(
			DfasItemStreamValidationError,
		);
	});

	it("computes max sequence", () => {
		const entries = [
			createDfasItemStreamEntry({
				id: "a",
				threadId: "t",
				sequence: 3,
				itemType: DFAS_ITEM_TYPE.USER_MESSAGE,
				fiscalScope: scope,
				payload: { text: "a" },
			}),
			createDfasItemStreamEntry({
				id: "b",
				threadId: "t",
				sequence: 7,
				itemType: DFAS_ITEM_TYPE.USER_MESSAGE,
				fiscalScope: scope,
				payload: { text: "b" },
			}),
		];
		expect(maxItemSequence(entries)).toBe(7);
		expect(maxItemSequence([])).toBe(-1);
	});
});
