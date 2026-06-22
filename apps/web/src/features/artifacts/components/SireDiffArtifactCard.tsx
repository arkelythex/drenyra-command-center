import type { ArtifactInteractionEvent, SireDiffArtifact } from '../types/artifact.types';
import { SireDiffFooter } from './sire-diff-card/SireDiffFooter';
import { SireDiffSummaryGrid } from './sire-diff-card/SireDiffSummaryGrid';
import { SireDiffTable } from './sire-diff-card/SireDiffTable';
import { useSireDiffKeyboardShortcuts } from './sire-diff-card/useSireDiffKeyboardShortcuts';
import { useSireDiffArtifactController } from './sire-diff-card/useSireDiffArtifactController';

interface SireDiffArtifactCardProps {
  artifact: SireDiffArtifact;
  onEvent: (event: ArtifactInteractionEvent) => void;
}

export function SireDiffArtifactCard({ artifact, onEvent }: SireDiffArtifactCardProps) {
  const controller = useSireDiffArtifactController({ artifact, onEvent });
  useSireDiffKeyboardShortcuts({
    enabled: controller.visibleRows.length > 0,
    selectedRowId: controller.selectedRowId,
    editingRowId: controller.editingRowId,
    hasDraftForRow: (rowId) => Boolean(controller.draftsByRow[rowId]),
    onMoveSelection: controller.moveSelection,
    onToggleInlineEditor: (rowId) =>
      controller.setEditingRowId((current) => (current === rowId ? null : rowId)),
    onSuggestInlineEdit: controller.suggestInlineEditById,
    onApplyInlineEdit: (rowId) => void controller.applyInlineEditById(rowId),
    onCloseInlineEditor: () => controller.setEditingRowId(null),
  });

  return (
    <div className="space-y-4">
      <SireDiffSummaryGrid period={artifact.data.period} currency={artifact.data.currency} summary={controller.summary} />

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
        onToggleMatches={() => controller.setShowMatches((previous) => !previous)}
        onCopyTable={controller.handleCopyTable}
        onExportExcel={controller.handleExportExcel}
        onSelectRow={controller.setSelectedRowId}
        onAcceptSunat={(rowId) => controller.setDecision(rowId, 'ACCEPT_SUNAT')}
        onKeepLocal={(rowId) => controller.setDecision(rowId, 'KEEP_LOCAL')}
        onToggleInlineEditor={(rowId) =>
          controller.setEditingRowId((current) => (current === rowId ? null : rowId))
        }
        onPromptChange={(rowId, prompt) =>
          controller.setPromptsByRow((prev) => ({ ...prev, [rowId]: prompt }))
        }
        onSuggestInlineEdit={controller.suggestInlineEdit}
        onApplyInlineEdit={(row) => void controller.applyInlineEdit(row)}
        onCloseInlineEditor={() => controller.setEditingRowId(null)}
      />

      <SireDiffFooter
        critical={controller.summary.critical}
        acceptSunat={controller.totals.acceptSunat}
        keepLocal={controller.totals.keepLocal}
        pending={controller.totals.pending}
        onApplyKeepLocalBatch={() => void controller.applyBatch('KEEP_LOCAL')}
        onApplyAcceptSunatBatch={() => void controller.applyBatch('ACCEPT_SUNAT')}
      />
    </div>
  );
}
