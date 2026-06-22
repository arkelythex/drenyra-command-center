import type { ReactNode } from 'react';
import { Copy, FileSpreadsheet, Landmark, Send } from 'lucide-react';
import type { ArtifactInteractionEvent, PaymentPreviewArtifact } from '../types/artifact.types';
import { PaymentBeneficiaryList } from './payment-preview-card/PaymentBeneficiaryList';
import { usePaymentPreviewArtifactController } from './payment-preview-card/usePaymentPreviewArtifactController';
import { usePaymentPreviewKeyboardShortcuts } from './payment-preview-card/usePaymentPreviewKeyboardShortcuts';
import { formatMoney } from './payment-preview-card/utils';

interface PaymentPreviewArtifactCardProps {
  artifact: PaymentPreviewArtifact;
  onEvent: (event: ArtifactInteractionEvent) => void;
}

export const PaymentPreviewArtifactCard = ({ artifact, onEvent }: PaymentPreviewArtifactCardProps) => {
  const controller = usePaymentPreviewArtifactController({ artifact, onEvent });

  usePaymentPreviewKeyboardShortcuts({
    enabled: controller.beneficiaries.length > 0,
    selectedBeneficiaryId: controller.selectedBeneficiaryId,
    editingBeneficiaryId: controller.editingBeneficiaryId,
    hasDraft: (beneficiaryId) => Boolean(controller.draftsByBeneficiary[beneficiaryId]),
    onMoveSelection: controller.moveSelection,
    onToggleInlineEditor: controller.toggleInlineEditor,
    onSuggestInlineEdit: controller.suggestInlineEditById,
    onApplyInlineEdit: (beneficiaryId) => void controller.applyInlineEditById(beneficiaryId),
    onCloseInlineEditor: () => controller.setEditingBeneficiaryId(null),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card/70 p-3">
          <p className="text-2xs uppercase tracking-widest text-muted-foreground">Cuenta Origen</p>
          <p className="mt-1 text-sm font-black">{artifact.data.bankAccount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/70 p-3">
          <p className="text-2xs uppercase tracking-widest text-muted-foreground">Proveedor Bancario</p>
          <p className="mt-1 text-sm font-black">{artifact.data.provider}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/70 p-3">
          <p className="text-2xs uppercase tracking-widest text-muted-foreground">Total Lote</p>
          <p className="mt-1 text-sm font-black">{formatMoney(controller.totalAmount, artifact.data.currency)}</p>
        </div>
      </div>

      <PaymentBeneficiaryList
        beneficiaries={controller.beneficiaries}
        currency={artifact.data.currency}
        selectedBeneficiaryId={controller.selectedBeneficiaryId}
        editingBeneficiaryId={controller.editingBeneficiaryId}
        promptsByBeneficiary={controller.promptsByBeneficiary}
        draftsByBeneficiary={controller.draftsByBeneficiary}
        onSelectBeneficiary={controller.setSelectedBeneficiaryId}
        onToggleInlineEditor={controller.toggleInlineEditor}
        onPromptChange={(beneficiaryId, prompt) =>
          controller.setPromptsByBeneficiary((prev) => ({ ...prev, [beneficiaryId]: prompt }))
        }
        onSuggestInlineEdit={controller.suggestInlineEditById}
        onApplyInlineEdit={(beneficiaryId) => void controller.applyInlineEditById(beneficiaryId)}
        onCloseInlineEditor={() => controller.setEditingBeneficiaryId(null)}
      />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <ActionButton icon={<Copy size={12} className="mr-1" />} label="Copiar Tabla" onClick={controller.handleCopyTable} />
        <ActionButton
          icon={<FileSpreadsheet size={12} className="mr-1" />}
          label="Exportar Excel"
          onClick={controller.handleExportExcel}
        />
        <button
          type="button"
          onClick={controller.handleCancel}
          className="h-9 rounded-xl border border-red-500/30 bg-red-500/10 px-3 text-2xs font-black uppercase tracking-wider text-red-300"
        >
          Cancelar
        </button>
        <ActionButton
          icon={<Landmark size={12} className="mr-1" />}
          label="Confirmar lote (2 firmas)"
          onClick={() => void controller.handleConfirmPayment()}
          className="border-primary/30 bg-primary/20 text-primary"
        />
        <ActionButton
          icon={<Send size={12} className="mr-1" />}
          label="Descargar resumen"
          onClick={controller.handleDownloadVoucher}
        />
      </div>
    </div>
  );
};

interface ActionButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

function ActionButton({ icon, label, onClick, className }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex h-9 items-center rounded-xl border border-border bg-card/70 px-3 text-2xs font-black uppercase tracking-wider text-foreground hover:bg-muted/70',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {icon}
      {label}
    </button>
  );
}
