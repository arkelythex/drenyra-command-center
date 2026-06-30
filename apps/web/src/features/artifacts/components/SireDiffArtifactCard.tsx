import { Link } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";
import type {
	ArtifactInteractionEvent,
	SireDiffArtifact,
} from "../types/artifact.types";
import { SireDiffFooter } from "./sire-diff-card/SireDiffFooter";
import { SireDiffSummaryGrid } from "./sire-diff-card/SireDiffSummaryGrid";
import { SireDiffTable } from "./sire-diff-card/SireDiffTable";
import { useSireDiffArtifactController } from "./sire-diff-card/useSireDiffArtifactController";
import { useSireDiffKeyboardShortcuts } from "./sire-diff-card/useSireDiffKeyboardShortcuts";

interface SireDiffArtifactCardProps {
	artifact: SireDiffArtifact;
	onEvent: (event: ArtifactInteractionEvent) => void;
}

export function SireDiffArtifactCard({
	artifact,
	onEvent,
}: SireDiffArtifactCardProps) {
	const controller = useSireDiffArtifactController({ artifact, onEvent });
	useSireDiffKeyboardShortcuts({
		enabled: controller.visibleRows.length > 0,
		selectedRowId: controller.selectedRowId,
		editingRowId: controller.editingRowId,
		hasDraftForRow: (rowId) => Boolean(controller.draftsByRow[rowId]),
		onMoveSelection: controller.moveSelection,
		onToggleInlineEditor: (rowId) =>
			controller.setEditingRowId((current) =>
				current === rowId ? null : rowId,
			),
		onSuggestInlineEdit: controller.suggestInlineEditById,
		onApplyInlineEdit: (rowId) => void controller.applyInlineEditById(rowId),
		onCloseInlineEditor: () => controller.setEditingRowId(null),
	});

	return (
		<div className="space-y-4">
			{artifact.data.sunatSource === "unavailable" &&
			artifact.data.sunatMessage ? (
				<div
					role="alert"
					className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100"
				>
					<p className="font-semibold uppercase tracking-wider text-amber-200">
						SUNAT row data unavailable
					</p>
					<p className="mt-1 text-muted-foreground">
						{artifact.data.sunatMessage}
					</p>
				</div>
			) : null}

			<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
				<p className="text-2xs text-muted-foreground">
					Evidence dossiers for period {artifact.data.period}
				</p>
				<Link
					to="/cumplimiento/expedientes"
					search={{
						periodo: artifact.data.period,
						kind: "SIRE_COMPRAS",
						q: undefined,
					}}
					className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-primary hover:bg-primary/20"
				>
					<FolderOpen size={12} />
					Open expediente
				</Link>
			</div>

			<SireDiffSummaryGrid
				period={artifact.data.period}
				currency={artifact.data.currency}
				summary={controller.summary}
			/>

			<SireDiffTable
				visibleRows={controller.visibleRows}
				currency={artifact.data.currency}
				statusFilter={controller.statusFilter}
				showMatches={controller.showMatches}
				matchRowsHidden={controller.matchRowsHidden}
				decisions={controller.decisions}
				draftsByRow={controller.draftsByRow}
				selectedRowId={controller.selectedRowId}
				editingRowId={controller.editingRowId}
				promptsByRow={controller.promptsByRow}
				onStatusFilterChange={controller.setStatusFilter}
				onToggleMatches={() =>
					controller.setShowMatches((previous) => !previous)
				}
				onCopyTable={controller.handleCopyTable}
				onExportExcel={controller.handleExportExcel}
				onSelectRow={controller.setSelectedRowId}
				onAcceptSunat={(rowId) => controller.setDecision(rowId, "ACCEPT_SUNAT")}
				onKeepLocal={(rowId) => controller.setDecision(rowId, "KEEP_LOCAL")}
				onToggleInlineEditor={(rowId) =>
					controller.setEditingRowId((current) =>
						current === rowId ? null : rowId,
					)
				}
				onPromptChange={(rowId, prompt) =>
					controller.setPromptsByRow((prev) => ({ ...prev, [rowId]: prompt }))
				}
				onSuggestInlineEdit={controller.suggestInlineEdit}
				onApplyInlineEdit={(row) => void controller.applyInlineEdit(row)}
				onCloseInlineEditor={() => controller.setEditingRowId(null)}
				period={artifact.data.period}
			/>

			<SireDiffFooter
				critical={controller.summary.critical}
				acceptSunat={controller.totals.acceptSunat}
				keepLocal={controller.totals.keepLocal}
				pending={controller.totals.pending}
				submitBlocked={controller.submitGate.submitBlocked}
				submitBlockReason={controller.submitGate.submitBlockReason}
				onApplyKeepLocalBatch={() => void controller.applyBatch("KEEP_LOCAL")}
				onApplyAcceptSunatBatch={() =>
					void controller.applyBatch("ACCEPT_SUNAT")
				}
			/>
		</div>
	);
}
