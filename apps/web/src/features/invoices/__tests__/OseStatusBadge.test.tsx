import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OseStatusBadge } from "../components/OseStatusBadge";

describe("OseStatusBadge", () => {
	it("renders the accepted OSE status", () => {
		render(<OseStatusBadge status="ACCEPTED" />);
		expect(screen.getByText(/aceptad/i)).toBeInTheDocument();
	});

	it("renders the rejected OSE status", () => {
		render(<OseStatusBadge status="REJECTED" />);
		expect(screen.getByText(/rechazad/i)).toBeInTheDocument();
	});

	it("falls back for an absent status", () => {
		render(<OseStatusBadge status={null} className="custom-status" />);
		expect(screen.getByText(/pendiente/i)).toHaveClass("custom-status");
	});
});
