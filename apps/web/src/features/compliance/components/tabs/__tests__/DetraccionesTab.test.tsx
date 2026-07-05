import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DetraccionesTab } from "../DetraccionesTab";

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	// Pre-populate the detractions cache so useQuery resolves synchronously
	// with empty data, triggering the fallback to MOCK_DATA
	queryClient.setQueryData(["detractions"], []);
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	};
}

describe("DetraccionesTab", () => {
	it("renders title, status summary and pending actions", () => {
		render(<DetraccionesTab />, { wrapper: createWrapper() });

		expect(screen.getByText("Control de Detracciones")).toBeInTheDocument();
		expect(screen.getByText(/Banco de la Nación/i)).toBeInTheDocument();
		expect(screen.getByText(/Inconsistencias Detectadas/i)).toBeInTheDocument();

		expect(
			screen.getAllByRole("button", { name: /generar nps/i }),
		).toHaveLength(6);
		expect(screen.getAllByText(/Conciliado/i)).toHaveLength(4);
	});
});
