import { describe, expect, it } from "vitest";
import { RESOLVED_HUB_EVENTS } from "../hub-events.constants";
import { INTELLIGENCE_ITEMS } from "@/lib/navigation/items/intelligence";

describe("Drenyra branding alignment", () => {
	it("uses Drenyra subagents in resolved demo events", () => {
		expect(RESOLVED_HUB_EVENTS.map((event) => event.agent)).toEqual(
			expect.arrayContaining(["Eviden", "Vigila"]),
		);
	});

	it("exposes Drenyra workspace in intelligence navigation", () => {
		const hubItem = INTELLIGENCE_ITEMS.find((item) => item.id === "drenyra");
		expect(hubItem?.label).toBe("Drenyra");
	});
});
