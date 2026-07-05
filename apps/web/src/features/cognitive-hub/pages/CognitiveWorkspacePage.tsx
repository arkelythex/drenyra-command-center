import { lazy, Suspense, useEffect } from "react";
import { useSettings } from "@/context/SettingsContext";
import { useHubState } from "../hooks/useHubState";

const HubLayout = lazy(() =>
	import("../components/HubLayout").then((m) => ({ default: m.HubLayout })),
);

/**
 * CognitiveWorkspacePage: Vista Inmersiva del Cerebro (Codex Style)
 * Esta es la versión de pantalla completa del Cognitive Hub.
 * NOTA: No está enrutada activamente — /chat redirige a /drenyra.
 * Se mantiene para compatibilidad y futuro uso como página independiente.
 */
export function CognitiveWorkspacePage() {
	const params = new URLSearchParams(
		typeof window !== "undefined" ? window.location.search : "",
	);
	const fiscalCaseId = params.get("fiscalCaseId");
	const fiscalCaseLabel = params.get("fiscalCaseLabel");
	const {
		setMode,
		setShowHistory,
		setFiscalCase,
		hydrateFiscalCaseFromSession,
	} = useHubState();
	const { settings } = useSettings();

	useEffect(() => {
		setMode("chat");
		setShowHistory(window.matchMedia("(min-width: 1280px)").matches);
	}, [setMode, setShowHistory]);

	useEffect(() => {
		if (fiscalCaseId) {
			setFiscalCase(fiscalCaseId, fiscalCaseLabel);
			return;
		}
		hydrateFiscalCaseFromSession();
	}, [
		fiscalCaseId,
		fiscalCaseLabel,
		setFiscalCase,
		hydrateFiscalCaseFromSession,
	]);

	return (
		<div
			className="ui-agent-shell relative flex h-full w-full overflow-hidden bg-bg-0 text-primary"
			data-testid="cognitive-workspace-route"
		>
			<div className="relative z-10 flex flex-1 overflow-hidden">
				<Suspense fallback={<WorkspaceLayoutSkeleton />}>
					<HubLayout />
				</Suspense>
			</div>
		</div>
	);
}

function WorkspaceLayoutSkeleton() {
	return (
		<div className="grid h-full w-full bg-bg-0 xl:grid-cols-[minmax(0,1fr)_320px]">
			<div className="ui-agent-panel min-h-[420px]" />
			<div className="ui-agent-history-panel hidden min-h-[420px] border-l border-subtle bg-surface-1 xl:block" />
		</div>
	);
}
