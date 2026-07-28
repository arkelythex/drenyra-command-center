import { describe, it, expect, beforeEach } from "vitest";
import {
	useSireDiffWorkspaceStore,
	type SireDiffWorkspaceState,
} from "../stores/sire-diff-workspace.store";

describe("SireDiffWorkspaceStore", () => {
	beforeEach(() => {
		// Reset store state between tests
		useSireDiffWorkspaceStore.setState({
			period: "2026-03",
			artifactId: null,
			artifact: null,
			workspaceStep: "context",
			decisions: {},
			draftsByRow: {},
			isLoading: false,
			error: null,
		});
	});

	it("initializes with default workspace state", () => {
		const state = useSireDiffWorkspaceStore.getState();

		expect(state.period).toBe("2026-03");
		expect(state.artifactId).toBeNull();
		expect(state.artifact).toBeNull();
		expect(state.workspaceStep).toBe("context");
		expect(state.decisions).toEqual({});
		expect(state.draftsByRow).toEqual({});
		expect(state.isLoading).toBe(false);
		expect(state.error).toBeNull();
	});

	it("setArtifact stores the diff artifact and transitions to diff step", () => {
		const mockArtifact = {
			id: "artifact-123",
			type: "sire.diff.v1" as const,
			version: "1.0",
			status: "PREVIEW" as const,
			metadata: {
				traceId: "trace-001",
				correlationId: "corr-001",
				source: "SUNAT" as const,
				createdAt: new Date().toISOString(),
				actor: "user-1",
			},
			title: "SIRE Diff 2026-03",
			data: {
				period: "2026-03",
				currency: "PEN" as const,
				summary: {
					matched: 10,
					mismatched: 3,
					missingOnLedger: 1,
					missingOnSunat: 2,
					critical: 4,
					totalDifference: 1500,
				},
				rows: [],
			},
			actions: [],
		};

		useSireDiffWorkspaceStore.getState().setArtifact(mockArtifact as any);

		const state = useSireDiffWorkspaceStore.getState();
		expect(state.artifact).toEqual(mockArtifact);
		expect(state.artifactId).toBe("artifact-123");
		expect(state.workspaceStep).toBe("diff");
		expect(state.error).toBeNull();
	});

	it("setWorkspaceStep transitions to a valid step", () => {
		useSireDiffWorkspaceStore.getState().setWorkspaceStep("resolve");

		expect(useSireDiffWorkspaceStore.getState().workspaceStep).toBe("resolve");
	});

	it("setWorkspaceStep ignores invalid step values", () => {
		const initialStep = useSireDiffWorkspaceStore.getState().workspaceStep;

		// @ts-expect-error — testing runtime guard against invalid step
		useSireDiffWorkspaceStore.getState().setWorkspaceStep("invalid_step");

		expect(useSireDiffWorkspaceStore.getState().workspaceStep).toBe(initialStep);
	});

	it("setDecision stores a row decision", () => {
		useSireDiffWorkspaceStore.getState().setDecision("row-1", "ACCEPTED_SUNAT");

		expect(useSireDiffWorkspaceStore.getState().decisions).toEqual({
			"row-1": "ACCEPTED_SUNAT",
		});
	});

	it("setLoading transitions loading state", () => {
		useSireDiffWorkspaceStore.getState().setLoading(true);
		expect(useSireDiffWorkspaceStore.getState().isLoading).toBe(true);

		useSireDiffWorkspaceStore.getState().setLoading(false);
		expect(useSireDiffWorkspaceStore.getState().isLoading).toBe(false);
	});

	it("setError stores error and clears loading", () => {
		useSireDiffWorkspaceStore.getState().setLoading(true);
		useSireDiffWorkspaceStore.getState().setError("Network failure");

		const state = useSireDiffWorkspaceStore.getState();
		expect(state.error).toBe("Network failure");
		expect(state.isLoading).toBe(false);
	});

	it("clearError removes error state", () => {
		useSireDiffWorkspaceStore.getState().setError("Some error");
		useSireDiffWorkspaceStore.getState().clearError();

		expect(useSireDiffWorkspaceStore.getState().error).toBeNull();
	});

	it("reset clears everything except period default", () => {
		useSireDiffWorkspaceStore.getState().setArtifact({
			id: "artifact-456",
		} as any);
		useSireDiffWorkspaceStore.getState().setDecision("row-1", "KEPT_LOCAL");
		useSireDiffWorkspaceStore.getState().setWorkspaceStep("review");

		useSireDiffWorkspaceStore.getState().reset();

		const state = useSireDiffWorkspaceStore.getState();
		expect(state.period).toBe("2026-03");
		expect(state.artifactId).toBeNull();
		expect(state.artifact).toBeNull();
		expect(state.workspaceStep).toBe("context");
		expect(state.decisions).toEqual({});
		expect(state.draftsByRow).toEqual({});
		expect(state.isLoading).toBe(false);
		expect(state.error).toBeNull();
	});
});
