import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { buildTsvText, copyTextToClipboard, downloadCsvFile } from '@/lib/export-utils';
import { buildSireInlinePatches } from '../../patches/sire-inline-patches';
import { usePolicyGate } from '../../policy';
import type { ArtifactInteractionEvent, SireDiffArtifact, SireDiffRow } from '../../types/artifact.types';
import type { RowDecision, RowDraft, SireStatusFilter } from './types';
import { SIRE_EXPORT_HEADERS } from './constants';
import {
  applyDecisionInBatch,
  buildSireExportRows,
  buildDraft,
  buildSummary,
  countDecisions,
  createArtifactEvent,
  createInitialDecisions,
} from './utils';
import { buildRowFromDraft } from './row-patching';
import { useSireRowSelection } from './useSireRowSelection';
interface UseSireDiffArtifactControllerInput {
  artifact: SireDiffArtifact;
  onEvent: (event: ArtifactInteractionEvent) => void;
}

export function useSireDiffArtifactController({ artifact, onEvent }: UseSireDiffArtifactControllerInput) {
  const { requestApproval } = usePolicyGate();
  const acceptBatchAction = artifact.actions.find((action) => action.id === 'accept-sunat-batch');

  const [rows, setRows] = useState<SireDiffRow[]>(artifact.data.rows);
  const [decisions, setDecisions] = useState<Record<string, RowDecision>>(() => createInitialDecisions(artifact.data.rows));
  const [statusFilter, setStatusFilter] = useState<SireStatusFilter>('ALL');
  const [showMatches, setShowMatches] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [promptsByRow, setPromptsByRow] = useState<Record<string, string>>({});
  const [draftsByRow, setDraftsByRow] = useState<Record<string, RowDraft>>({});

  const summary = useMemo(() => buildSummary(rows), [rows]);
  const totals = useMemo(() => countDecisions(decisions), [decisions]);
  const exportRows = useMemo(() => buildSireExportRows(rows), [rows]);

  const visibleRows = useMemo(
    () =>
      rows.filter((row) => {
        if (!showMatches && row.status === 'MATCH') return false;
        if (statusFilter === 'ALL') return true;
        return row.status === statusFilter;
      }),
    [rows, showMatches, statusFilter],
  );
  const rowsById = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);

  const matchRowsHidden = rows.filter((row) => row.status === 'MATCH').length;
  const { selectedRowId, setSelectedRowId, moveSelection } = useSireRowSelection({
    visibleRows,
    initialRowId: artifact.data.rows[0]?.id ?? null,
    onSelectionReset: () => setEditingRowId(null),
  });

  const setDecision = (rowId: string, decision: Exclude<RowDecision, 'PENDING'>) => {
    setDecisions((prev) => ({ ...prev, [rowId]: decision }));
    onEvent(
      createArtifactEvent(
        artifact,
        decision === 'ACCEPT_SUNAT' ? 'accept-row-sunat' : 'keep-row-local',
        `Fila ${rowId}: ${decision === 'ACCEPT_SUNAT' ? 'aceptada propuesta SUNAT' : 'se mantiene registro local'}.`,
      ),
    );
  };

  const applyBatch = async (decision: Exclude<RowDecision, 'PENDING'>) => {
    let approvalPayload: Record<string, unknown> | undefined;

    if (decision === 'ACCEPT_SUNAT') {
      const policyDecision = await requestApproval({
        artifactId: artifact.id,
        artifactType: artifact.type,
        traceId: artifact.metadata.traceId,
        actionId: acceptBatchAction?.id ?? 'accept-sunat-batch',
        actionLabel: acceptBatchAction?.label ?? 'Aceptar SUNAT (lote)',
        riskLevel: acceptBatchAction?.riskLevel ?? 'HIGH',
        policyGate: acceptBatchAction?.policyGate,
      });

      if (!policyDecision.allowed || !policyDecision.proof) {
        toast.error(policyDecision.reason ?? 'Policy gate rechazo la accion por lote.');
        onEvent(
          createArtifactEvent(
            artifact,
            'policy-gate-denied',
            policyDecision.reason ?? 'Lote SUNAT bloqueado por policy gate.',
          ),
        );
        return;
      }

      approvalPayload = {
        policy: {
          key: acceptBatchAction?.policyGate?.policyKey ?? 'SIRE_BATCH_COMMIT',
          riskLevel: acceptBatchAction?.riskLevel ?? 'HIGH',
        },
        approval: policyDecision.proof,
      };
    }

    setDecisions(applyDecisionInBatch(rows, decision));
    onEvent({
      ...createArtifactEvent(
        artifact,
        decision === 'ACCEPT_SUNAT' ? 'accept-sunat-batch' : 'keep-local-batch',
        decision === 'ACCEPT_SUNAT'
          ? `Se aplico la propuesta SUNAT a ${rows.length} filas.`
          : `Se mantuvo el criterio local en ${rows.length} filas.`,
        'COMMITTED',
      ),
      payload: approvalPayload,
    });
  };

  const suggestInlineEdit = (row: SireDiffRow) => {
    const prompt = promptsByRow[row.id] ?? '';
    const draft = buildDraft(row, prompt);

    if (!draft) {
      onEvent(createArtifactEvent(artifact, 'inline-ai-edit-invalid', `Fila ${row.id}: no se pudo interpretar la instruccion.`));
      return;
    }

    const nextRow = buildRowFromDraft(row, artifact, draft);
    const patches = buildSireInlinePatches(row, nextRow, draft.note);
    const draftWithPatch: RowDraft = { ...draft, patches };

    setDraftsByRow((prev) => ({ ...prev, [row.id]: draftWithPatch }));
    onEvent({
      ...createArtifactEvent(artifact, 'inline-ai-edit-preview', `Fila ${row.id}: sugerencia IA generada.`),
      payload: { patches, patchCount: patches.length },
    });
  };

  const suggestInlineEditById = (rowId: string) => {
    const row = rowsById.get(rowId);
    if (!row) return;
    suggestInlineEdit(row);
  };

  const applyInlineEdit = async (row: SireDiffRow) => {
    const draft = draftsByRow[row.id];
    if (!draft) return;

    const nextRow = buildRowFromDraft(row, artifact, draft);
    const patches = draft.patches ?? buildSireInlinePatches(row, nextRow, draft.note);
    const hasHighRiskPatch = patches.some((patch) => patch.riskLevel === 'HIGH' || patch.riskLevel === 'CRITICAL');

    if (hasHighRiskPatch) {
      const policyDecision = await requestApproval({
        artifactId: artifact.id,
        artifactType: artifact.type,
        traceId: artifact.metadata.traceId,
        actionId: 'inline-ai-edit-apply',
        actionLabel: 'Aplicar edicion IA inline',
        riskLevel: 'HIGH',
        policyGate: {
          policyKey: 'INLINE_AI_EDIT_APPLY',
          requiresReason: true,
          requiresDualApproval: false,
        },
      });

      if (!policyDecision.allowed) {
        toast.error(policyDecision.reason ?? 'Policy gate rechazo el patch inline.');
        onEvent(
          createArtifactEvent(
            artifact,
            'policy-gate-denied',
            policyDecision.reason ?? `Fila ${row.id}: patch inline bloqueado por policy gate.`,
          ),
        );
        return;
      }
    }

    setRows((prev) => prev.map((candidate) => (candidate.id === row.id ? nextRow : candidate)));
    setDecisions((prev) => ({
      ...prev,
      [row.id]: nextRow.status === 'MATCH' ? 'KEEP_LOCAL' : prev[row.id] ?? 'PENDING',
    }));

    setDraftsByRow((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });

    onEvent({
      ...createArtifactEvent(artifact, 'inline-ai-edit-apply', `Fila ${row.id}: se aplico ajuste sugerido por IA.`),
      payload: { patches, patchCount: patches.length },
    });
  };

  const applyInlineEditById = async (rowId: string) => {
    const row = rowsById.get(rowId);
    if (!row) return;
    await applyInlineEdit(row);
  };

  const handleCopyTable = async () => {
    try {
      const tsv = buildTsvText([...SIRE_EXPORT_HEADERS], exportRows);
      await copyTextToClipboard(tsv);
      toast.success('Tabla SIRE copiada para Excel');
      onEvent(createArtifactEvent(artifact, 'copy-table', 'Se copio tabla SIRE al portapapeles.'));
    } catch {
      toast.error('No se pudo copiar la tabla SIRE');
    }
  };

  const handleExportExcel = () => {
    downloadCsvFile(`sire-diff-${artifact.data.period}.csv`, [...SIRE_EXPORT_HEADERS], exportRows);
    toast.success('CSV SIRE exportado (compatible con Excel)');
    onEvent(createArtifactEvent(artifact, 'export-excel', 'Se exporto conciliacion SIRE a CSV.'));
  };

  return {
    summary,
    totals,
    visibleRows,
    decisions,
    draftsByRow,
    selectedRowId,
    editingRowId,
    matchRowsHidden,
    promptsByRow,
    showMatches,
    statusFilter,
    setStatusFilter,
    setShowMatches,
    setSelectedRowId,
    setEditingRowId,
    setPromptsByRow,
    setDecision,
    applyBatch,
    suggestInlineEdit,
    suggestInlineEditById,
    applyInlineEdit,
    applyInlineEditById,
    moveSelection,
    handleCopyTable,
    handleExportExcel,
  };
}
