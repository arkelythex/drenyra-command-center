import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SurfacePanel } from "../SurfacePanel";

describe("SurfacePanel", () => {
	it("is a plain container by default", () => {
		render(<SurfacePanel>contenido</SurfacePanel>);
		expect(screen.queryByRole("button")).toBeNull();
	});

	it("interactive with onClick is a focusable button activated by click, Enter and Space", () => {
		const onClick = vi.fn();
		render(
			<SurfacePanel variant="interactive" onClick={onClick}>
				abrir
			</SurfacePanel>,
		);
		const panel = screen.getByRole("button");
		expect(panel).toHaveAttribute("tabindex", "0");
		fireEvent.click(panel);
		fireEvent.keyDown(panel, { key: "Enter" });
		fireEvent.keyDown(panel, { key: " " });
		fireEvent.keyDown(panel, { key: "a" });
		expect(onClick).toHaveBeenCalledTimes(3);
	});

	it("interactive without onClick stays inert", () => {
		render(<SurfacePanel variant="interactive">solo lectura</SurfacePanel>);
		expect(screen.queryByRole("button")).toBeNull();
	});

	it("still forwards the caller's onKeyDown", () => {
		const onKeyDown = vi.fn();
		render(<SurfacePanel onKeyDown={onKeyDown}>x</SurfacePanel>);
		fireEvent.keyDown(screen.getByText("x"), { key: "a" });
		expect(onKeyDown).toHaveBeenCalledOnce();
	});

	it("applies the xl padding", () => {
		render(<SurfacePanel padding="xl">x</SurfacePanel>);
		expect(screen.getByText("x").className).toContain("p-8");
	});
});
