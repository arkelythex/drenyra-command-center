import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReviewQueuePage } from "../ReviewQueuePage";

const mocks = vi.hoisted(() => ({ listQueue: vi.fn(), getQueueStats: vi.fn() }));
vi.mock("../review-queue.api", () => mocks);

function renderPage() {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return render(
		<QueryClientProvider client={client}><ReviewQueuePage /></QueryClientProvider>,
	);
}

describe("ReviewQueuePage", () => {
	it("renders queue statistics and grouped review items", async () => {
		mocks.listQueue.mockResolvedValue({ data: [{ id: "q-1", diffId: "d-1", title: "Factura crítica", type: "risk", priority: "critical", status: "pending", clientName: "Acme", period: "2026-01", agentName: "Agente", riskScore: 88, createdAt: "2026-01-01" }] });
		mocks.getQueueStats.mockResolvedValue({ pending: 1, critical: 1, high: 0, medium: 0, low: 0, overdue: 0 });
		renderPage();
		expect(await screen.findByText("Factura crítica")).toBeInTheDocument();
		expect(screen.getByText("CRÍTICA · 1")).toBeInTheDocument();
		expect(screen.getByText("Pendientes: 1")).toBeInTheDocument();
	});

	it("shows the empty queue message", async () => {
		mocks.listQueue.mockResolvedValue({ data: [] });
		mocks.getQueueStats.mockResolvedValue({ pending: 0, critical: 0, high: 0, medium: 0, low: 0, overdue: 0 });
		renderPage();
		expect(await screen.findByText("No hay items pendientes de revisión")).toBeInTheDocument();
	});

	it("links each item to its diff detail", async () => {
		mocks.listQueue.mockResolvedValue({ data: [{ id: "q-1", diffId: "diff-42", title: "Factura", type: "risk", priority: "high", status: "pending", clientName: "Acme", period: "2026-01", agentName: "Agente", riskScore: 20, createdAt: "2026-01-01" }] });
		mocks.getQueueStats.mockResolvedValue({ pending: 1, critical: 0, high: 1, medium: 0, low: 0, overdue: 0 });
		renderPage();
		expect((await screen.findByRole("link", { name: "Revisar" })).getAttribute("href")).toBe("/diffs/?id=diff-42");
	});
});
