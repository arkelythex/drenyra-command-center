import { toast } from 'sonner';
import { buildTsvText, copyTextToClipboard, downloadCsvFile } from '@/lib/export-utils';
import type { ArtifactInteractionEvent, ArtifactAction, PaymentBeneficiary, PaymentPreviewArtifact } from '../../types/artifact.types';
import type { PolicyGateRequest, PolicyGateResult } from '../../policy/types';
import { emitPaymentEvent, formatMoney } from './utils';

const TABLE_HEADERS = ['Beneficiario', 'Cuenta', 'Monto', 'Moneda', 'Proveedor'];

interface CreatePaymentPreviewBatchActionsInput {
  artifact: PaymentPreviewArtifact;
  confirmAction: ArtifactAction | undefined;
  beneficiaries: PaymentBeneficiary[];
  totalAmount: number;
  tableRows: string[][];
  onEvent: (event: ArtifactInteractionEvent) => void;
  requestApproval: (request: PolicyGateRequest) => Promise<PolicyGateResult>;
}

export function createPaymentPreviewBatchActions({
  artifact,
  confirmAction,
  beneficiaries,
  totalAmount,
  tableRows,
  onEvent,
  requestApproval,
}: CreatePaymentPreviewBatchActionsInput) {
  const handleCopyTable = async () => {
    try {
      const tsv = buildTsvText(TABLE_HEADERS, tableRows);
      await copyTextToClipboard(tsv);
      toast.success('Tabla copiada para Excel');
      onEvent(emitPaymentEvent(artifact, 'copy-table', 'Se copio tabla de beneficiarios al portapapeles.'));
    } catch {
      toast.error('No se pudo copiar la tabla');
    }
  };

  const handleExportExcel = () => {
    const filename = `payment-preview-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsvFile(filename, TABLE_HEADERS, tableRows);
    toast.success('CSV exportado (compatible con Excel)');
    onEvent(emitPaymentEvent(artifact, 'export-excel', 'Se exporto tabla de beneficiarios a CSV.'));
  };

  const handleConfirmPayment = async () => {
    const gateResult = await requestApproval({
      artifactId: artifact.id,
      artifactType: artifact.type,
      traceId: artifact.metadata.traceId,
      actionId: confirmAction?.id ?? 'confirm-payment',
      actionLabel: confirmAction?.label ?? 'Confirmar lote',
      riskLevel: confirmAction?.riskLevel ?? 'HIGH',
      policyGate: confirmAction?.policyGate,
    });

    if (!gateResult.allowed || !gateResult.proof) {
      toast.error(gateResult.reason ?? 'Accion bloqueada por policy gate');
      onEvent(
        emitPaymentEvent(
          artifact,
          'policy-gate-denied',
          gateResult.reason ?? 'Policy gate rechazo confirmar lote.',
        ),
      );
      return;
    }

    onEvent({
      ...emitPaymentEvent(
        artifact,
        'confirm-payment',
        `Lote confirmado para ${beneficiaries.length} beneficiarios por ${formatMoney(totalAmount, artifact.data.currency)}.`,
        'COMMITTED',
      ),
      payload: {
        policy: {
          key: confirmAction?.policyGate?.policyKey ?? 'PAYMENT_BATCH_EXECUTION',
          riskLevel: confirmAction?.riskLevel ?? 'CRITICAL',
        },
        approval: gateResult.proof,
      },
    });
  };

  const handleCancel = () => {
    onEvent(emitPaymentEvent(artifact, 'cancel-payment', 'Se canceló la vista previa del lote de pagos.', 'ROLLED_BACK'));
  };

  const handleDownloadVoucher = () => {
    onEvent(emitPaymentEvent(artifact, 'download-voucher', 'Se generó el resumen del lote en formato PDF.'));
  };

  return {
    handleCopyTable,
    handleExportExcel,
    handleConfirmPayment,
    handleCancel,
    handleDownloadVoucher,
  };
}
