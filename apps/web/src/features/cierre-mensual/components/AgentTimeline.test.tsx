import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MissionTimelineEvent } from "../mission.types";
import { AgentTimeline } from "./AgentTimeline";

const MOCK_EVENTS: MissionTimelineEvent[] = [
	{
		id: "evt-1",
		timestamp: "2026-07-09T10:00:00Z",
		actor: "agent",
		action: "Importación de comprobantes",
		description: "Se importaron 428 comprobantes de ventas",
		status: "success",
	},
	{
		id: "evt-2",
		timestamp: "2026-07-09T10:05:00Z",
		actor: "sunat",
		action: "Validación SUNAT",
		description: "7 comprobantes con inconsistencias",
		status: "warning",
	},
];

describe("AgentTimeline", () => {
	it("renders timeline events", () => {
		render(<AgentTimeline events={MOCK_EVENTS} />);

		expect(screen.getByText("Importación de comprobantes")).toBeInTheDocument();
		expect(screen.getByText("Validación SUNAT")).toBeInTheDocument();
	});

	it("shows empty state when no events", () => {
		render(<AgentTimeline events={[]} />);

		expect(
			screen.getByText("No hay eventos en la línea de tiempo."),
		).toBeInTheDocument();
	});
});
