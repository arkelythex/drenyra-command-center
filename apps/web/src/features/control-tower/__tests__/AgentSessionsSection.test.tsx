import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AgentSessionsSection } from "../components/AgentSessionsSection";

vi.mock("@/features/agents/query-options", () => ({
	agentsListQueryOptions: vi.fn(() => ({
		queryKey: ["agents"],
		queryFn: async () => ({ data: [] }),
	})),
}));

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
			},
		},
	});
	return {
		wrapper: ({ children }: { children: ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		),
	};
}

describe("AgentSessionsSection", () => {
	it("renders 'Actividad de Agentes' heading", () => {
		const { wrapper } = createWrapper();
		render(<AgentSessionsSection />, { wrapper });
		expect(screen.getByText(/Actividad de Agentes/)).toBeTruthy();
	});

	it("shows loading state when fetching", () => {
		const { wrapper } = createWrapper();
		render(<AgentSessionsSection />, { wrapper });
		expect(screen.getByText(/Cargando sesiones/)).toBeTruthy();
	});
});
