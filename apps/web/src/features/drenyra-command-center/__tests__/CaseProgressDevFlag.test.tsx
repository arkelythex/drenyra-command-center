/**
 * CaseProgressDevFlag — Integration tests for CaseProgress dev-flag integration.
 *
 * Verifies that CaseProgress renders correctly with expected prop combinations
 * used when the dev flag `DRENYRA_V2_CASE_PROGRESS` is enabled in
 * CommandCenterChat.
 *
 * @since Jul 2026
 */

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CaseProgress } from "@/features/agents/CaseProgress";

describe("CaseProgress dev flag integration", () => {
	beforeEach(() => {
		localStorage.setItem("DRENYRA_V2_CASE_PROGRESS", "true");
	});

	afterEach(() => {
		localStorage.removeItem("DRENYRA_V2_CASE_PROGRESS");
	});

	it("renders with mock running status", () => {
		render(<CaseProgress completed={2} total={4} status="running" />);
		expect(screen.getByText(/2 de 4 verificaciones/)).toBeTruthy();
		expect(screen.getByText(/Revisando/)).toBeTruthy();
	});

	it("renders with awaiting_approval status", () => {
		render(<CaseProgress completed={4} total={4} status="awaiting_approval" />);
		expect(screen.getByText(/4 de 4 verificaciones/)).toBeTruthy();
		expect(screen.getByText(/Listo para tu revisión/)).toBeTruthy();
	});
});
