import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const useDraggableMock = vi.hoisted(() => vi.fn());
vi.mock("@dnd-kit/core", () => ({ useDraggable: useDraggableMock }));

import { CashflowCard } from "../components/widgets/CashflowCard";

const task = {
	id: "task-1",
	title: "Cobro mensual",
	type: "INCOME" as const,
	priority: "HIGH" as const,
	amount: 2500,
	date: "15 MAR",
};

describe("CashflowCard", () => {
	it("renders the cashflow task details", () => {
		useDraggableMock.mockReturnValue({ attributes: {}, listeners: {}, setNodeRef: vi.fn(), transform: null, isDragging: false });
		render(<CashflowCard task={task} index={0} />);
		expect(screen.getByText("Cobro mensual")).toBeInTheDocument();
		expect(screen.getByText("HIGH")).toBeInTheDocument();
		expect(screen.getByText("15 MAR")).toBeInTheDocument();
	});

	it("registers the task as draggable", () => {
		useDraggableMock.mockReturnValue({ attributes: {}, listeners: {}, setNodeRef: vi.fn(), transform: null, isDragging: false });
		render(<CashflowCard task={task} index={2} />);
		expect(useDraggableMock).toHaveBeenCalledWith({ id: "task-1" });
	});

	it("renders expense tasks", () => {
		useDraggableMock.mockReturnValue({ attributes: {}, listeners: {}, setNodeRef: vi.fn(), transform: null, isDragging: false });
		render(<CashflowCard task={{ ...task, type: "EXPENSE", priority: "LOW" }} index={0} />);
		expect(screen.getByText("LOW")).toBeInTheDocument();
	});
});
