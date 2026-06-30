import { describe, expect, it } from "vitest";
import {
	CIERRE_AGGREGATE_TYPE,
	EXPEDIENTE_AGGREGATE_TYPE,
} from "../../domain/constants";

describe("expediente evidence constants", () => {
	it("uses stable aggregate type markers", () => {
		expect(EXPEDIENTE_AGGREGATE_TYPE).toBe("expediente_fiscal");
		expect(CIERRE_AGGREGATE_TYPE).toBe("cierre_mensual");
	});
});
