import type { CurrencyCode, SireDiffRow } from '../../types/artifact.types';
import type { RowDecision, RowDraft } from './types';
import { SireDiffRowView } from './SireDiffRow';
import { SireDiffToolbar } from './SireDiffToolbar';
import type { SireStatusFilter } from './types';

interface SireDiffTableProps {
  visibleRows: SireDiffRow[];
  currency: CurrencyCode;
  statusFilter: SireStatusFilter;
  showMatches: boolean;
  matchRowsHidden: number;
  decisions: Record<string, RowDecision>;
  draftsByRow: Record<string, RowDraft>;
  selectedRowId: string | null;
  editingRowId: string | null;
  promptsByRow: Record<string, string>;
  onStatusFilterChange: (next: SireStatusFilter) => void;
  onToggleMatches: () => void;
  onCopyTable: () => void;
  onExportExcel: () => void;
  onSelectRow: (rowId: string) => void;
  onAcceptSunat: (rowId: string) => void;
  onKeepLocal: (rowId: string) => void;
  onToggleInlineEditor: (rowId: string) => void;
  onPromptChange: (rowId: string, prompt: string) => void;
  onSuggestInlineEdit: (row: SireDiffRow) => void;
  onApplyInlineEdit: (row: SireDiffRow) => void;
  onCloseInlineEditor: () => void;
}

export function SireDiffTable({
  visibleRows,
  currency,
  statusFilter,
  showMatches,
  matchRowsHidden,
  decisions,
  draftsByRow,
  selectedRowId,
  editingRowId,
  promptsByRow,
  onStatusFilterChange,
  onToggleMatches,
  onCopyTable,
  onExportExcel,
  onSelectRow,
  onAcceptSunat,
  onKeepLocal,
  onToggleInlineEditor,
  onPromptChange,
  onSuggestInlineEdit,
  onApplyInlineEdit,
  onCloseInlineEditor,
}: SireDiffTableProps) {
  return (
    <div className="overflow-auto rounded-2xl border border-border">
      <SireDiffToolbar
        statusFilter={statusFilter}
        showMatches={showMatches}
        matchRowsHidden={matchRowsHidden}
        onStatusFilterChange={onStatusFilterChange}
        onToggleMatches={onToggleMatches}
        onCopyTable={onCopyTable}
        onExportExcel={onExportExcel}
      />

      <table className="min-w-full divide-y divide-border text-xs">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left font-black uppercase tracking-wider">Estado</th>
            <th className="px-3 py-2 text-left font-black uppercase tracking-wider">Local</th>
            <th className="px-3 py-2 text-left font-black uppercase tracking-wider">SUNAT</th>
            <th className="px-3 py-2 text-left font-black uppercase tracking-wider">Diferencia</th>
            <th className="px-3 py-2 text-left font-black uppercase tracking-wider">Motivo</th>
            <th className="px-3 py-2 text-left font-black uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {visibleRows.map((row) => (
            <SireDiffRowView
              key={row.id}
              row={row}
              currency={currency}
              isSelected={selectedRowId === row.id}
              decision={decisions[row.id] ?? 'PENDING'}
              draft={draftsByRow[row.id]}
              isInlineEditorOpen={editingRowId === row.id}
              prompt={promptsByRow[row.id] ?? ''}
              onSelectRow={() => onSelectRow(row.id)}
              onAcceptSunat={() => onAcceptSunat(row.id)}
              onKeepLocal={() => onKeepLocal(row.id)}
              onToggleInlineEditor={() => onToggleInlineEditor(row.id)}
              onPromptChange={(nextPrompt) => onPromptChange(row.id, nextPrompt)}
              onSuggestInlineEdit={() => onSuggestInlineEdit(row)}
              onApplyInlineEdit={() => onApplyInlineEdit(row)}
              onCloseInlineEditor={onCloseInlineEditor}
            />
          ))}

          {visibleRows.length === 0 ? (
            <tr>
              <td className="px-3 py-5 text-center text-label uppercase tracking-wider text-muted-foreground" colSpan={6}>
                Sin filas para el filtro seleccionado.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
