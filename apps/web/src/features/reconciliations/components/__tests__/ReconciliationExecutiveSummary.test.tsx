import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReconciliationExecutiveSummary } from "../sections/ReconciliationExecutiveSummary";

describe("ReconciliationExecutiveSummary", () => {
	it("renders nothing when there are no movements to reconcile", () => {
		const { container } = render(
			<ReconciliationExecutiveSummary
				unmatchedCount={0}
				unmatchedExposure="S/ 0.00"
				reconciledRate={null}
				decisionRequiresHuman={false}
			/>,
		);
		expect(container).toBeEmptyDOMElement();
	});

	it("shows real figures and never fabricated evidence", () => {
		render(
			<ReconciliationExecutiveSummary
				unmatchedCount={2}
				unmatchedExposure="S/ 1,500.00"
				reconciledRate={33}
				decisionRequiresHuman
			/>,
		);
		expect(screen.getByText("33%")).toBeInTheDocument();
		expect(screen.getByText("S/ 1,500.00")).toBeInTheDocument();
		expect(screen.getByText(/requiere revisión/i)).toBeInTheDocument();
		expect(screen.queryByText(/extracto bcp/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/REC-/)).not.toBeInTheDocument();
		expect(screen.queryByText(/última revisión/i)).not.toBeInTheDocument();
	});
});
