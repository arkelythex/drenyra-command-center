import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SimulationProvider } from "../SimulationContext";

const { customToast } = vi.hoisted(() => ({
	customToast: vi.fn(),
}));

vi.mock("sonner", () => ({
	toast: {
		custom: customToast,
	},
}));

describe("SimulationProvider", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		customToast.mockClear();
	});

	afterEach(() => {
		vi.runOnlyPendingTimers();
		vi.useRealTimers();
	});

	it("does not schedule demo notifications when disabled on public routes", () => {
		render(
			<SimulationProvider enabled={false}>
				<div>Login</div>
			</SimulationProvider>,
		);

		vi.advanceTimersByTime(60_000);

		expect(customToast).not.toHaveBeenCalled();
	});
});
