import { describe, expect, it } from "vitest";
import { CHECK_CATEGORIES, CHECK_STATUSES } from "../../types";

describe("doctor mode check contracts", () => {
	it("includes the database category", () => {
		expect(CHECK_CATEGORIES).toContain("database");
	});

	it("includes the AI API category", () => {
		expect(CHECK_CATEGORIES).toContain("ai_api");
	});

	it("includes a healthy status", () => {
		expect(CHECK_STATUSES).toContain("healthy");
	});

	it("includes a degraded status", () => {
		expect(CHECK_STATUSES).toContain("degraded");
	});

	it("includes a down status", () => {
		expect(CHECK_STATUSES).toContain("down");
	});
});
