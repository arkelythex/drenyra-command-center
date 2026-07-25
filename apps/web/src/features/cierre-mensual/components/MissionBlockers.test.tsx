import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MissionBlocker } from "../mission.types";
import { MissionBlockers } from "./MissionBlockers";

const ACTIVE_BLOCKERS: MissionBlocker[] = [
	{
		id: "b1",
		reason: "3 comprobantes rechazados por inconsistencias RUC",
		severity: "high",
		resolved: false,
	},
	{
		id: "b2",
		reason: "2 bancos sin conciliar",
		severity: "medium",
		resolved: false,
	},
];

const RESOLVED_BLOCKERS: MissionBlocker[] = [
	{
		id: "b3",
		reason: "Declaración vencida resuelta",
		severity: "high",
		resolved: true,
		resolvedAt: "2026-07-09T12:00:00Z",
		resolvedBy: "user-1",
	},
];

describe("MissionBlockers", () => {
	it("renders active blockers with severity", () => {
		render(<MissionBlockers blockers={ACTIVE_BLOCKERS} />);

		expect(
			screen.getByText("3 comprobantes rechazados por inconsistencias RUC"),
		).toBeInTheDocument();
		expect(screen.getByText("2 bancos sin conciliar")).toBeInTheDocument();
		expect(screen.getByText("Alto")).toBeInTheDocument();
		expect(screen.getByText("Medio")).toBeInTheDocument();
	});

	it("shows active count badge", () => {
		render(<MissionBlockers blockers={ACTIVE_BLOCKERS} />);

		expect(screen.getByText("2 activos")).toBeInTheDocument();
	});

	it("returns null when blockers array is empty", () => {
		const { container } = render(<MissionBlockers blockers={[]} />);

		expect(container.innerHTML).toBe("");
	});

	it("shows resolved blockers in collapsible section", () => {
		render(
			<MissionBlockers blockers={[...ACTIVE_BLOCKERS, ...RESOLVED_BLOCKERS]} />,
		);

		expect(screen.getByText("1 bloqueador resuelto")).toBeInTheDocument();
	});
});
