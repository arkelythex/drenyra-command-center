import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SireDiffPage } from "../SireDiffPage";

const { mutateAsyncMock } = vi.hoisted(() => ({ mutateAsyncMock: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
}));
vi.mock("@/components/ui/PageShell", () => ({
	PageShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/components/agentic/DiffViewerV3", () => ({
	DiffViewerV3: ({ title }: { title: string }) => <section>{title}</section>,
}));
vi.mock("@/features/artifacts/components/SireDiffArtifactCard", () => ({
	SireDiffArtifactCard: () => <section>SIRE artifact</section>,
}));
vi.mock("../hooks/useSireDiff", () => ({
	useSireDiffMutation: () => ({ isPending: false, mutateAsync: mutateAsyncMock }),
}));
vi.mock("../mapSireDiffResponseToArtifact", () => ({
	mapSireDiffResponseToArtifact: () => ({
		data: { summary: { matched: 2, mismatched: 1, missingOnLedger: 0, missingOnSunat: 0, critical: 1 } },
	}),
}));

describe("SireDiffPage", () => {
	beforeEach(() => vi.clearAllMocks());

	it("renders the reconciliation controls and evidence link", () => {
		render(<SireDiffPage />);
		expect(screen.getByRole("heading", { name: "SIRE Diff" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /run three-way diff/i })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /open expediente evidence/i })).toHaveAttribute(
			"href",
			"/cumplimiento/expedientes?periodo=2026-03",
		);
	});

	it("submits the selected period and files", async () => {
		mutateAsyncMock.mockResolvedValue({});
		render(<SireDiffPage />);
		fireEvent.change(screen.getByDisplayValue("2026-03"), { target: { value: "2026-04" } });
		const file = new File(["proposal"], "sire.csv", { type: "text/csv" });
		fireEvent.change(screen.getByLabelText("SIRE proposal file"), { target: { files: [file] } });
		fireEvent.click(screen.getByRole("button", { name: /run three-way diff/i }));
		await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledWith({ period: "2026-04", sireFile: file, cpeFile: undefined }));
	});

	it("shows the generated artifact and reconciliation summary", async () => {
		mutateAsyncMock.mockResolvedValue({});
		render(<SireDiffPage />);
		fireEvent.click(screen.getByRole("button", { name: /run three-way diff/i }));
		expect(await screen.findByText("SIRE artifact")).toBeInTheDocument();
		expect(screen.getByText("Reconciliation summary")).toBeInTheDocument();
	});
});
