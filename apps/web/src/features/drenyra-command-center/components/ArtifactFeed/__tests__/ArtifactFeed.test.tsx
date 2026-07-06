import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CognitiveMessage } from "@/features/cognitive-hub/types/hub.types";
import { ArtifactFeed } from "../ArtifactFeed";

describe("ArtifactFeed", () => {
	it("shows empty state when no messages have artifacts", () => {
		const messages: CognitiveMessage[] = [
			{
				id: "m1",
				role: "user",
				content: "Hello",
				timestamp: new Date(),
			},
			{
				id: "m2",
				role: "assistant",
				content: "Hi there",
				timestamp: new Date(),
			},
		];
		render(<ArtifactFeed messages={messages} />);
		expect(screen.getByText(/Sin artifacts/)).toBeTruthy();
	});

	it("renders artifacts from messages in chronological order", () => {
		const messages: CognitiveMessage[] = [
			{
				id: "m1",
				role: "user",
				content: "Process invoice",
				timestamp: new Date("2026-01-01T10:00:00"),
			},
			{
				id: "m2",
				role: "assistant",
				content: "Done",
				timestamp: new Date("2026-01-01T10:01:00"),
				artifacts: [
					{
						id: "a1",
						title: "Invoice result",
						type: "explanation",
						content: "Processed successfully",
					},
				],
			},
		];
		render(<ArtifactFeed messages={messages} />);
		expect(screen.getByText("Invoice result")).toBeTruthy();
		expect(screen.queryByText(/Sin artifacts/)).toBeNull();
	});

	it("collects artifacts from multiple messages", () => {
		const messages: CognitiveMessage[] = [
			{
				id: "m1",
				role: "assistant",
				content: "Step 1",
				timestamp: new Date("2026-01-01T10:00:00"),
				artifacts: [
					{ id: "a1", title: "First", type: "explanation", content: "ok" },
				],
			},
			{
				id: "m2",
				role: "assistant",
				content: "Step 2",
				timestamp: new Date("2026-01-01T10:02:00"),
				artifacts: [
					{
						id: "a2",
						title: "Second",
						type: "chart",
						payload: { data: [1, 2] },
					},
				],
			},
		];
		render(<ArtifactFeed messages={messages} />);
		expect(screen.getByText("First")).toBeTruthy();
		expect(screen.getByText("Second")).toBeTruthy();
	});
});
