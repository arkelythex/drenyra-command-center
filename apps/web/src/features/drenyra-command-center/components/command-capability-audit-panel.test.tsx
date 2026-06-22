import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommandCapabilityAuditPanel } from "./command-capability-audit-panel";

const listCommandAuditEventsMock = vi.hoisted(() => vi.fn());

vi.mock("../api/drenyra-command-audit.api", () => ({
	listCommandAuditEvents: (...args: unknown[]) =>
		listCommandAuditEventsMock(...args),
}));

function renderWithQueryClient(children: ReactNode) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
	);
}

describe("CommandCapabilityAuditPanel", () => {
	beforeEach(() => {
		listCommandAuditEventsMock.mockReset();
		listCommandAuditEventsMock.mockResolvedValue([
			{
				id: "audit-1",
				eventType: "CAPABILITY_DENIED",
				actorId: "user-1",
				message: "Denied",
				occurredAt: "2026-05-27T00:00:00.000Z",
				metadata: { commandId: "review-sunat", toolId: "run_agent_review" },
			},
		]);
	});

	it("renders command capability audit traces", async () => {
		renderWithQueryClient(<CommandCapabilityAuditPanel />);

		expect(await screen.findByText("CAPABILITY_DENIED")).toBeInTheDocument();
		expect(screen.getByText(/review-sunat/)).toBeInTheDocument();
		expect(screen.getByText("1")).toBeInTheDocument();
	});

	it("filters by decision and command id", async () => {
		const user = userEvent.setup();
		renderWithQueryClient(<CommandCapabilityAuditPanel />);

		await screen.findByText("CAPABILITY_DENIED");
		await user.click(screen.getByRole("button", { name: "DENIED" }));
		await user.type(screen.getByLabelText("Filtrar por comando"), "review-sunat");
		await user.click(screen.getByRole("button", { name: "Filtrar" }));

		expect(listCommandAuditEventsMock).toHaveBeenLastCalledWith({
			commandId: "review-sunat",
			eventType: "CAPABILITY_DENIED",
		});
	});
});
