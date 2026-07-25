import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CognitiveMessage } from "@/features/cognitive-hub/types/hub.types";
import { ArtifactFeed } from "../components/ArtifactFeed/ArtifactFeed";

// Integration test: verify ArtifactFeed works with realistic message data
describe("ArtifactFeed integration", () => {
	it("renders artifacts from typical session messages", () => {
		const messages: CognitiveMessage[] = [
			{
				id: "m1",
				role: "user",
				content: "Revisa la factura 001-23456",
				timestamp: new Date("2026-01-01T10:00:00"),
			},
			{
				id: "m2",
				role: "assistant",
				content: "Aquí está el resultado del análisis:",
				timestamp: new Date("2026-01-01T10:01:00"),
				artifacts: [
					{
						id: "a1",
						title: "Factura 001-23456",
						type: "explanation",
						content: "Documento procesado exitosamente. IGV: S/ 45.00.",
					},
				],
			},
			{
				id: "m3",
				role: "assistant",
				content: "Previsualización de asientos:",
				timestamp: new Date("2026-01-01T10:02:00"),
				artifacts: [
					{
						id: "a2",
						title: "Simulación de asientos contables",
						type: "simulation",
						payload: {
							entries: [
								{ account: "70111", debit: 295, credit: 0 },
								{ account: "40111", debit: 0, credit: 45 },
							],
						},
					},
				],
			},
		];

		render(<ArtifactFeed messages={messages} />);
		expect(screen.getByText("Factura 001-23456")).toBeTruthy();
		expect(screen.getByText("Simulación de asientos contables")).toBeTruthy();
		expect(screen.getByText(/2 asientos simulados/)).toBeTruthy();
	});
});
