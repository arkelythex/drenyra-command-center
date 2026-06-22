import React from "react";
import { useDiscrepancyResolutionStore } from "../components/anomaly/use-discrepancy-resolution.store";
import {
	buildDefaultDiscrepancyScenario,
	buildDiscrepancyArtifactFromScenario,
} from "../components/anomaly/discrepancy-scenario";
import { commitDiscrepancyResolution } from "../api/discrepancy-resolution.api";
import { toast } from "sonner";
import { useSoundUI } from "@/hooks/useSoundUI";
import type { HubArtifact } from "@arkelythex/shared/artifacts";

const UNDO_WINDOW_MS = 10_000;

export const useDiscrepancyFlow = (
	runId: string | null,
	activeArtifact: HubArtifact | null,
	setActiveArtifact: (a: HubArtifact | null) => void,
) => {
	const { playSound } = useSoundUI();

	const [isDiscrepancyComposerOpen, setIsDiscrepancyComposerOpen] =
		React.useState(false);
	const [undoSecondsLeft, setUndoSecondsLeft] = React.useState(0);

	const scenario = useDiscrepancyResolutionStore((state) => state.scenario);
	const status = useDiscrepancyResolutionStore((state) => state.status);
	const undoExpiresAt = useDiscrepancyResolutionStore(
		(state) => state.undoExpiresAt,
	);
	const isApplied = useDiscrepancyResolutionStore((state) => state.isApplied);
	const initializeScenario = useDiscrepancyResolutionStore(
		(state) => state.initializeScenario,
	);
	const startOptimisticApply = useDiscrepancyResolutionStore(
		(state) => state.startOptimisticApply,
	);
	const markCommitted = useDiscrepancyResolutionStore(
		(state) => state.markCommitted,
	);
	const rollback = useDiscrepancyResolutionStore((state) => state.rollback);
	const markError = useDiscrepancyResolutionStore((state) => state.markError);
	const clearError = useDiscrepancyResolutionStore((state) => state.clearError);

	const pendingDiscrepancyRef = React.useRef<{
		commitId: string;
		timerId: number;
		previousArtifact: HubArtifact | null;
	} | null>(null);

	React.useEffect(() => {
		initializeScenario(buildDefaultDiscrepancyScenario());
	}, [initializeScenario]);

	React.useEffect(() => {
		if (status !== "pending_undo" || !undoExpiresAt) {
			setUndoSecondsLeft(0);
			return;
		}

		const syncUndoCountdown = () => {
			const remainingMs = undoExpiresAt - Date.now();
			setUndoSecondsLeft(Math.max(0, Math.ceil(remainingMs / 1000)));
		};

		syncUndoCountdown();
		const countdownIntervalId = window.setInterval(syncUndoCountdown, 250);
		return () => window.clearInterval(countdownIntervalId);
	}, [status, undoExpiresAt]);

	const handleUndo = React.useCallback(
		(commitId: string) => {
			const pending = pendingDiscrepancyRef.current;
			if (!pending || pending.commitId !== commitId) return;

			window.clearTimeout(pending.timerId);
			pendingDiscrepancyRef.current = null;
			rollback(commitId);
			React.startTransition(() => {
				setActiveArtifact(pending.previousArtifact);
			});

			toast.info("Corrección revertida", {
				description: "No se confirmó ningún cambio en el servidor.",
			});
		},
		[rollback, setActiveArtifact],
	);

	const flushCommit = React.useCallback(
		async (commitId: string) => {
			const pending = pendingDiscrepancyRef.current;
			if (!pending || pending.commitId !== commitId || !scenario) return;

			pendingDiscrepancyRef.current = null;

			try {
				await commitDiscrepancyResolution({
					commitId,
					runId: runId ?? `run-${Date.now()}`,
					scenario: scenario,
				});
				markCommitted(commitId);
				toast.success("Corrección confirmada", {
					description:
						"La conciliación quedó registrada con trazabilidad legal.",
				});
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "No se pudo confirmar la corrección.";
				markError(commitId, message);
				React.startTransition(() => {
					setActiveArtifact(pending.previousArtifact);
					setIsDiscrepancyComposerOpen(true);
				});
				toast.error("Error al confirmar la corrección", {
					description: message,
				});
			}
		},
		[scenario, markCommitted, markError, runId, setActiveArtifact],
	);

	const handleReview = () => {
		playSound("ping");
		if (!scenario) {
			initializeScenario(buildDefaultDiscrepancyScenario());
		}
		setIsDiscrepancyComposerOpen((prev) => !prev);
	};

	const handleAcceptSuggestion = () => {
		if (!scenario || status === "pending_undo" || pendingDiscrepancyRef.current)
			return;

		clearError();
		playSound("success");

		const commitId = crypto.randomUUID();
		const expiresAt = Date.now() + UNDO_WINDOW_MS;
		const prevArt = activeArtifact;

		startOptimisticApply(commitId, expiresAt);
		React.startTransition(() => {
			setActiveArtifact(buildDiscrepancyArtifactFromScenario(scenario));
			setIsDiscrepancyComposerOpen(false);
		});

		const tId = window.setTimeout(() => {
			void flushCommit(commitId);
		}, UNDO_WINDOW_MS);

		pendingDiscrepancyRef.current = {
			commitId,
			timerId: tId,
			previousArtifact: prevArt,
		};

		toast.warning("Corrección aplicada (provisional)", {
			description: "Puedes deshacer durante 10 segundos antes de confirmar.",
			duration: UNDO_WINDOW_MS,
			action: {
				label: "Deshacer",
				onClick: () => handleUndo(commitId),
			},
		});
	};

	return {
		isDiscrepancyComposerOpen,
		setIsDiscrepancyComposerOpen,
		undoSecondsLeft,
		status,
		scenario,
		isApplied,
		handleReview,
		handleAcceptSuggestion,
	};
};
