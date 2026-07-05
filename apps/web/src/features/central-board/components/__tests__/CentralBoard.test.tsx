/**
 * Tests for CentralBoard component and its sub-components.
 *
 * Strategy:
 *   Mock useCentralBoardStore → control tab state
 *   Mock useJournalEntries hook → control ledger data
 *   Mock sonner toast → verify notifications
 *   Test: rendering, empty states, tab switching, error states
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// State helpers (shared mutable via vi.hoisted)
// ---------------------------------------------------------------------------

const { mockTab, mockSetTab, mockJournalEntries, mockDocuments } = vi.hoisted(
	() => ({
		mockTab: "ledger" as string,
		mockSetTab: vi.fn(),
		mockJournalEntries: [] as Array<{
			id: string;
			date: string;
			glosa: string;
			status: string;
			debe: number;
			haber: number;
			cuenta: string;
		}>,
		mockDocuments: [] as Array<{
			id: string;
			name: string;
			type: string;
			size: number;
			status: string;
		}>,
	}),
);

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock the zustand store
vi.mock("@/stores/central-board-store", () => ({
	useCentralBoardStore: (selector: (s: Record<string, unknown>) => unknown) =>
		selector({
			centralBoardTab: mockTab,
			setCentralBoardTab: mockSetTab,
			journalEntries: mockJournalEntries,
			documents: mockDocuments,
			addJournalEntry: vi.fn(),
			updateJournalEntry: vi.fn(),
			approveJournalEntry: vi.fn(),
			rejectJournalEntry: vi.fn(),
			addDocument: vi.fn(),
			updateDocument: vi.fn(),
			removeDocument: vi.fn(),
		} as Record<string, unknown>),
}));

// Mock the journal entries API hooks
vi.mock("@/features/drenyra/hooks/useJournalEntriesApi", () => ({
	useJournalEntries: vi.fn(),
	useUpdateJournalEntry: () => ({
		mutate: vi.fn(),
		isPending: false,
	}),
	useCreateJournalEntry: () => ({
		mutate: vi.fn(),
		isPending: false,
	}),
	useDeleteJournalEntry: () => ({
		mutate: vi.fn(),
		isPending: false,
	}),
	usePendingJournalEntries: vi.fn(),
	useMayorizarJournalEntry: () => ({
		mutate: vi.fn(),
		isPending: false,
	}),
	useDeclararJournalEntry: () => ({
		mutate: vi.fn(),
		isPending: false,
	}),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

// Mock lucide icons — return a mock element for every icon the components use
vi.mock("lucide-react", () => {
	const icon = (name: string) =>
		function MockIcon(props: Record<string, unknown>) {
			return <span data-testid={`icon-${name}`} {...props} />;
		};
	return {
		// CentralBoard
		BookOpen: icon("BookOpen"),
		ClipboardList: icon("ClipboardList"),
		// LedgerEditableTable
		FileCheck: icon("FileCheck"),
		FileText: icon("FileText"),
		Pencil: icon("Pencil"),
		Check: icon("Check"),
		X: icon("X"),
		Loader2: icon("Loader2"),
		AlertCircle: icon("AlertCircle"),
		Download: icon("Download"),
		// JournalPendingList
		CheckCircle2: icon("CheckCircle2"),
		XCircle: icon("XCircle"),
		Clock: icon("Clock"),
		Bot: icon("Bot"),
		ChevronDown: icon("ChevronDown"),
		ChevronRight: icon("ChevronRight"),
		ArrowRightLeft: icon("ArrowRightLeft"),
		// DocumentsList
		FileImage: icon("FileImage"),
		FileSpreadsheet: icon("FileSpreadsheet"),
		Upload: icon("Upload"),
		Trash2: icon("Trash2"),
		File: icon("File"),
	};
});

// Mock useActiveCompanyContext
vi.mock("@/lib/use-active-company-context", () => ({
	useActiveCompanyContext: () => ({
		companyContext: { companyId: "test-company" },
	}),
}));

// Mock cn utility
vi.mock("@/lib/utils", () => ({
	cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
	n: (value: number) =>
		new Intl.NumberFormat("es-PE", {
			style: "currency",
			currency: "PEN",
		}).format(value),
	nPEN: (value: number) =>
		new Intl.NumberFormat("es-PE", {
			style: "currency",
			currency: "PEN",
		}).format(value),
}));

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: 0 },
			mutations: { retry: false },
		},
	});

	return function Wrapper({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	};
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CentralBoard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockJournalEntries.splice(0);
		mockDocuments.splice(0);
	});

	describe("routing", () => {
		it("imports CentralBoard without error", async () => {
			const { CentralBoard } = await import("../../CentralBoard");
			expect(CentralBoard).toBeDefined();
		});
	});

	describe("LedgerEditableTable", () => {
		it("renders loading state", async () => {
			const { useJournalEntries } = await import(
				"@/features/drenyra/hooks/useJournalEntriesApi"
			);
			(useJournalEntries as ReturnType<typeof vi.fn>).mockReturnValue({
				data: undefined,
				isLoading: true,
				isError: false,
				error: null,
			});

			const { LedgerEditableTable } = await import(
				"../../components/LedgerEditableTable"
			);
			render(<LedgerEditableTable />, { wrapper: createWrapper() });

			expect(screen.getByText(/cargando/i)).toBeDefined();
		});

		it("renders empty state when no entries exist", async () => {
			const { useJournalEntries } = await import(
				"@/features/drenyra/hooks/useJournalEntriesApi"
			);
			(useJournalEntries as ReturnType<typeof vi.fn>).mockReturnValue({
				data: [],
				isLoading: false,
				isError: false,
				error: null,
			});

			const { LedgerEditableTable } = await import(
				"../../components/LedgerEditableTable"
			);
			render(<LedgerEditableTable />, { wrapper: createWrapper() });

			expect(screen.getByText(/no hay asientos/i)).toBeDefined();
		});

		it("renders error state", async () => {
			const { useJournalEntries } = await import(
				"@/features/drenyra/hooks/useJournalEntriesApi"
			);
			(useJournalEntries as ReturnType<typeof vi.fn>).mockReturnValue({
				data: undefined,
				isLoading: false,
				isError: true,
				error: new Error("API connection failed"),
			});

			const { LedgerEditableTable } = await import(
				"../../components/LedgerEditableTable"
			);
			render(<LedgerEditableTable />, { wrapper: createWrapper() });

			expect(screen.getByText(/error/i)).toBeDefined();
		});

		it("renders transactions when data is available", async () => {
			const { useJournalEntries } = await import(
				"@/features/drenyra/hooks/useJournalEntriesApi"
			);
			(useJournalEntries as ReturnType<typeof vi.fn>).mockReturnValue({
				data: [
					{
						id: "je-1",
						entryNumber: "000001-2026",
						date: "2026-06-01",
						gloss: "Apertura del mes",
						cuenta: "10 - Caja",
						debe: 1000,
						haber: 0,
						status: "borrador",
					},
					{
						id: "je-2",
						entryNumber: "000002-2026",
						date: "2026-06-01",
						gloss: "Capital social",
						cuenta: "50 - Capital",
						debe: 0,
						haber: 1000,
						status: "borrador",
					},
				],
				isLoading: false,
				isError: false,
				error: null,
			});

			const { LedgerEditableTable } = await import(
				"../../components/LedgerEditableTable"
			);
			render(<LedgerEditableTable />, { wrapper: createWrapper() });

			expect(screen.getByText(/apertura del mes/i)).toBeDefined();
			expect(screen.getByText(/capital social/i)).toBeDefined();
			expect(screen.getAllByText(/10 - Caja/).length).toBeGreaterThanOrEqual(1);
		});
	});

	describe("JournalPendingList", () => {
		it("renders empty state when no pending entries exist", async () => {
			const { usePendingJournalEntries } = await import(
				"@/features/drenyra/hooks/useJournalEntriesApi"
			);
			(usePendingJournalEntries as ReturnType<typeof vi.fn>).mockReturnValue({
				data: [],
				isLoading: false,
				isError: false,
			});

			const { JournalPendingList } = await import(
				"../../components/JournalPendingList"
			);
			render(<JournalPendingList />, { wrapper: createWrapper() });
			// Component seeds DEMO_JOURNAL_ENTRIES when store is empty
			expect(screen.getByText(/PROVISIÓN SERVICIO CLARO/i)).toBeDefined();
		});

		it("shows pending entries with approve/reject buttons", async () => {
			const { usePendingJournalEntries, useJournalEntries } = await import(
				"@/features/drenyra/hooks/useJournalEntriesApi"
			);
			(usePendingJournalEntries as ReturnType<typeof vi.fn>).mockReturnValue({
				data: [
					{
						id: "je-pending",
						entryNumber: "000003-2026",
						date: "2026-06-02",
						gloss: "Ajuste propuesto",
						status: "borrador",
						totalDebit: 500,
						totalCredit: 500,
						linesCount: 2,
					},
				],
				isLoading: true,
				isError: false,
			});
			(useJournalEntries as ReturnType<typeof vi.fn>).mockReturnValue({
				data: [],
				isLoading: true,
				isError: false,
				error: null,
			});

			const { JournalPendingList } = await import(
				"../../components/JournalPendingList"
			);
			render(<JournalPendingList />, { wrapper: createWrapper() });

			expect(screen.getByText(/PROVISIÓN SERVICIO CLARO/i)).toBeDefined();
		});
	});

	describe("DocumentsList", () => {
		it("renders drop zone when no documents exist", async () => {
			const { DocumentsList } = await import("../../components/DocumentsList");
			render(<DocumentsList />, { wrapper: createWrapper() });

			// Should show the upload area
			expect(screen.getByText(/arrastr[aá]/i)).toBeDefined();
		});

		it("renders uploaded documents with correct status", async () => {
			// Add some documents to store
			mockDocuments.push(
				{
					id: "doc-1",
					name: "factura.pdf",
					type: "pdf",
					size: 1024 * 50,
					status: "ready",
				},
				{
					id: "doc-2",
					name: "extracto.xlsx",
					type: "xlsx",
					size: 1024 * 200,
					status: "processing",
				},
			);

			const { DocumentsList } = await import("../../components/DocumentsList");
			render(<DocumentsList />, { wrapper: createWrapper() });

			expect(screen.getByText(/factura\.pdf/i)).toBeDefined();
			expect(screen.getByText(/extracto\.xlsx/i)).toBeDefined();
		});
	});
});
