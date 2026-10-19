import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { syncActiveCompanyContextFromUser } from "../company-context";
import { useActiveCompanyContext } from "../use-active-company-context";

const access = (id: string, isDefault: boolean) => ({
	companyId: id,
	companyName: id.toUpperCase(),
	ruc: "20100000001",
	countryCode: "PE",
	membershipRole: "ADMIN",
	isDefault,
});

describe("useActiveCompanyContext", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("uses the demo company until a session sets one", () => {
		const { result } = renderHook(() => useActiveCompanyContext());
		expect(result.current.companyContext.companyId).toBe("demo-1");
	});

	it("follows the session company and reacts to switches", () => {
		syncActiveCompanyContextFromUser({
			availableCompanies: [access("cmp-a", true), access("cmp-b", false)],
		});
		const { result } = renderHook(() => useActiveCompanyContext());
		expect(result.current.companyContext.companyId).toBe("cmp-a");

		act(() => {
			result.current.setActiveCompanyById("cmp-b");
		});
		expect(result.current.companyContext.companyId).toBe("cmp-b");
	});

	it("exposes a stable snapshot between unrelated renders", () => {
		syncActiveCompanyContextFromUser({
			availableCompanies: [access("cmp-a", true)],
		});
		const { result, rerender } = renderHook(() => useActiveCompanyContext());
		const first = result.current.companyContext;
		rerender();
		expect(result.current.companyContext).toBe(first);
	});

	it("updates the fiscal period", () => {
		syncActiveCompanyContextFromUser({
			availableCompanies: [access("cmp-a", true)],
		});
		const { result } = renderHook(() => useActiveCompanyContext());
		act(() => {
			result.current.setActiveFiscalPeriod("2026-05");
		});
		expect(result.current.fiscalPeriod).toBe("2026-05");
		expect(result.current.formatFiscalPeriodLabel("2026-05")).toBe("Mayo 2026");
	});
});
