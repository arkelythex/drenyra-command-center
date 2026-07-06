import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CaseProgress } from "../CaseProgress";

describe("CaseProgress", () => {
	it("shows aggregated progress with completed/total count", () => {
		render(<CaseProgress completed={3} total={4} status="running" />);
		expect(screen.getByText(/3 de 4 verificaciones/)).toBeTruthy();
	});

	it("shows 'Listo para tu revisión' when all complete and awaiting approval", () => {
		render(<CaseProgress completed={4} total={4} status="awaiting_approval" />);
		expect(screen.getByText(/Listo para tu revisión/)).toBeTruthy();
	});

	it("shows 'Revisando...' when status is running", () => {
		render(<CaseProgress completed={1} total={4} status="running" />);
		expect(screen.getByText(/Revisando/)).toBeTruthy();
	});

	it("shows 'Falló' when status is failed", () => {
		render(<CaseProgress completed={2} total={4} status="failed" />);
		expect(screen.getByText(/Falló/)).toBeTruthy();
	});

	it("clamps progress between 0 and 100", () => {
		render(<CaseProgress completed={4} total={4} status="completed" />);
		expect(screen.getByText(/4 de 4 verificaciones/)).toBeTruthy();
	});
});
