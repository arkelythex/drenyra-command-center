import { X } from "lucide-react";
import { useEffect } from "react";
import {
	type InspectorPanelType,
	useAgenticShell,
} from "@/stores/agentic-shell.store";

const TYPE_LABEL: Record<InspectorPanelType, string> = {
	evidence: "Evidencia",
	"journal-proposal": "Propuesta de asiento",
	reconciliation: "Conciliación",
	invoice: "Comprobante",
	approval: "Aprobación",
	fiscal: "Fiscal",
	agent: "Agente",
	diff: "Cambios",
	thread: "Conversación",
};

/**
 * Inspector for the thing the person selected. Beside the content from `xl`
 * up; a bottom sheet with a backdrop below it, where a side column would
 * leave no room for the content.
 */
export function InspectorHost() {
	const activeInspector = useAgenticShell((s) => s.activeInspector);
	const closeInspector = useAgenticShell((s) => s.closeInspector);

	useEffect(() => {
		if (!activeInspector) return undefined;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") closeInspector();
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [activeInspector, closeInspector]);

	if (!activeInspector) return null;

	return (
		<>
			<button
				type="button"
				data-testid="inspector-backdrop"
				aria-hidden="true"
				tabIndex={-1}
				onClick={closeInspector}
				className="fixed inset-0 z-30 bg-black/40 xl:hidden"
			/>
			<aside
				role="dialog"
				aria-label={activeInspector.title}
				className="fixed inset-x-0 bottom-0 z-40 flex max-h-[70dvh] flex-col rounded-t-2xl border-t border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-2xl xl:static xl:z-auto xl:max-h-none xl:w-[380px] xl:shrink-0 xl:rounded-none xl:border-t-0 xl:border-l xl:pb-0 xl:shadow-none"
			>
				<div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
					<h2 className="truncate text-sm font-medium">
						{activeInspector.title}
					</h2>
					<button
						type="button"
						onClick={closeInspector}
						aria-label="Cerrar panel"
						className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
					>
						<X aria-hidden="true" size={16} />
					</button>
				</div>
				<dl className="space-y-2 overflow-y-auto p-4 text-sm">
					<div>
						<dt className="text-muted-foreground">Tipo</dt>
						<dd>{TYPE_LABEL[activeInspector.type]}</dd>
					</div>
					<div>
						<dt className="text-muted-foreground">Identificador</dt>
						<dd className="break-all tabular-nums">{activeInspector.id}</dd>
					</div>
				</dl>
			</aside>
		</>
	);
}
