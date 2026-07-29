import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArtifactRegistry } from "../ArtifactRegistry";
import type { WorkspaceArtifact } from "../types/artifact.types";

const { downloadJsonFileMock } = vi.hoisted(() => ({ downloadJsonFileMock: vi.fn() }));

vi.mock("@/lib/export-utils", () => ({
	downloadJsonFile: downloadJsonFileMock,
	downloadEncryptedJsonBackup: vi.fn(),
}));
vi.mock("../components/SireDiffArtifactCard", () => ({
	SireDiffArtifactCard: () => <div>SIRE preview</div>,
}));
vi.mock("../components/PaymentPreviewArtifactCard", () => ({
	PaymentPreviewArtifactCard: () => <div>Payment preview</div>,
}));
vi.mock("../components/SecureBackupDialog", () => ({
	SecureBackupDialog: ({ open }: { open: boolean }) => (open ? <div>Secure backup dialog</div> : null),
}));

const artifact: WorkspaceArtifact = {
	id: "artifact-1",
	type: "sire.diff.v1",
	version: "1.0.0",
	status: "PREVIEW",
	title: "April SIRE diff",
	description: "Reconciliation preview",
	metadata: {
		traceId: "trace-1",
		correlationId: "correlation-1",
		source: "SUNAT",
		createdAt: "2026-04-01T00:00:00Z",
		actor: "system",
		policyResult: { allowed: true },
	},
	data: { period: "2026-04", currency: "PEN", summary: {}, rows: [] },
	actions: [],
} as WorkspaceArtifact;

describe("ArtifactRegistry", () => {
	beforeEach(() => vi.clearAllMocks());

	it("renders artifact metadata, policy status, and a supported preview", () => {
		render(<ArtifactRegistry artifact={artifact} onClose={vi.fn()} onEvent={vi.fn()} />);
		expect(screen.getByText("April SIRE diff")).toBeInTheDocument();
		expect(screen.getByText("Policy: OK")).toBeInTheDocument();
		expect(screen.getByText("SIRE preview")).toBeInTheDocument();
	});

	it("closes the inspector when requested", () => {
		const onClose = vi.fn();
		render(<ArtifactRegistry artifact={artifact} onClose={onClose} onEvent={vi.fn()} />);
		fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
		expect(onClose).toHaveBeenCalledOnce();
	});

	it("downloads an offline backup and records its audit event", () => {
		const onEvent = vi.fn();
		render(<ArtifactRegistry artifact={artifact} onClose={vi.fn()} onEvent={onEvent} />);
		fireEvent.click(screen.getByRole("button", { name: "Backup" }));
		expect(downloadJsonFileMock).toHaveBeenCalledWith(
		"artifact-backup-sire-diff-v1-artifact-1.json",
		expect.objectContaining({ artifact }),
	);
		expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ actionId: "download-offline-backup", artifactId: "artifact-1" }));
	});

	it("opens the encrypted backup flow", () => {
		render(<ArtifactRegistry artifact={artifact} onClose={vi.fn()} onEvent={vi.fn()} />);
		fireEvent.click(screen.getByRole("button", { name: "Cifrar" }));
		expect(screen.getByText("Secure backup dialog")).toBeInTheDocument();
	});
});
