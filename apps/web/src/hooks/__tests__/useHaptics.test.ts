import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	HAPTIC_PATTERNS,
	triggerHaptic,
	useFinancialHaptics,
	useHaptics,
} from "../useHaptics";

const vibrate = vi.fn(() => true);

function setReducedMotion(reduced: boolean) {
	window.matchMedia = vi.fn().mockReturnValue({ matches: reduced });
}

beforeEach(() => {
	vibrate.mockClear();
	Object.defineProperty(navigator, "vibrate", {
		value: vibrate,
		configurable: true,
	});
	setReducedMotion(false);
});

afterEach(() => {
	// biome-ignore lint/performance/noDelete: restore the missing API
	delete (navigator as { vibrate?: unknown }).vibrate;
});

describe("triggerHaptic", () => {
	it("vibrates with the pattern of the requested kind", () => {
		expect(triggerHaptic("success")).toBe(true);
		expect(vibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS.success);
	});

	it("does nothing when the user prefers reduced motion", () => {
		setReducedMotion(true);
		expect(triggerHaptic("light")).toBe(false);
		expect(vibrate).not.toHaveBeenCalled();
	});

	it("does nothing when the device cannot vibrate", () => {
		// biome-ignore lint/performance/noDelete: simulate an unsupported device
		delete (navigator as { vibrate?: unknown }).vibrate;
		expect(triggerHaptic("light")).toBe(false);
	});

	it("swallows errors thrown by the platform", () => {
		vibrate.mockImplementationOnce(() => {
			throw new Error("blocked");
		});
		expect(triggerHaptic("error")).toBe(false);
	});
});

describe("hooks", () => {
	it("useHaptics returns a stable trigger", () => {
		const { result, rerender } = renderHook(() => useHaptics());
		const first = result.current.trigger;
		rerender();
		expect(result.current.trigger).toBe(first);
		result.current.trigger("medium");
		expect(vibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS.medium);
	});

	it("useFinancialHaptics maps semantics to kinds", () => {
		const { result } = renderHook(() => useFinancialHaptics());
		result.current.warning();
		result.current.approval();
		result.current.onSave();
		expect(vibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS.warning);
		expect(vibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS.medium);
		expect(vibrate).toHaveBeenCalledWith(HAPTIC_PATTERNS.success);
	});
});
