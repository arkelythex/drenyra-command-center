import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConversationBubble } from "../conversation-bubble";
import type { ConversationStep } from "../demo-showcase.types";

const assistantStep: ConversationStep = {
	index: 1,
	role: "assistant",
	content: "Validé el comprobante y generé el resumen.",
	artifactType: "tax_summary",
};

describe("ConversationBubble", () => {
	it("does not render hidden steps", () => {
		render(<ConversationBubble step={assistantStep} visible={false} />);

		expect(
			screen.queryByText(/validé el comprobante/i),
		).not.toBeInTheDocument();
	});

	it("renders visible assistant steps and artifact labels without motion wrappers", () => {
		const { container } = render(
			<ConversationBubble step={assistantStep} visible />,
		);

		expect(screen.getByText(/validé el comprobante/i)).toBeInTheDocument();
		expect(screen.getByText(/tax summary generado/i)).toBeInTheDocument();
		expect(container.querySelector("[style*='transform']")).toBeNull();
	});
});
