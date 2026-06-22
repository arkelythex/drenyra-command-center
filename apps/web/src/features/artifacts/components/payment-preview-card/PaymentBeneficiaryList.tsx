import type { CurrencyCode, PaymentBeneficiary } from '../../types/artifact.types';
import type { PaymentBeneficiaryDraft } from './types';
import { PaymentBeneficiaryItem } from './PaymentBeneficiaryItem';

interface PaymentBeneficiaryListProps {
  beneficiaries: PaymentBeneficiary[];
  currency: CurrencyCode;
  selectedBeneficiaryId: string | null;
  editingBeneficiaryId: string | null;
  promptsByBeneficiary: Record<string, string>;
  draftsByBeneficiary: Record<string, PaymentBeneficiaryDraft>;
  onSelectBeneficiary: (beneficiaryId: string) => void;
  onToggleInlineEditor: (beneficiaryId: string) => void;
  onPromptChange: (beneficiaryId: string, prompt: string) => void;
  onSuggestInlineEdit: (beneficiaryId: string) => void;
  onApplyInlineEdit: (beneficiaryId: string) => void;
  onCloseInlineEditor: () => void;
}

export function PaymentBeneficiaryList({
  beneficiaries,
  currency,
  selectedBeneficiaryId,
  editingBeneficiaryId,
  promptsByBeneficiary,
  draftsByBeneficiary,
  onSelectBeneficiary,
  onToggleInlineEditor,
  onPromptChange,
  onSuggestInlineEdit,
  onApplyInlineEdit,
  onCloseInlineEditor,
}: PaymentBeneficiaryListProps) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-4">
      <h4 className="mb-2 text-label font-black uppercase tracking-widest text-foreground">Beneficiarios</h4>
      <p className="mb-3 text-3xs font-black uppercase tracking-wider text-primary/70">↑↓ fila | Cmd/Ctrl+K editar | Cmd/Ctrl+Enter aplicar</p>

      <div className="space-y-2">
        {beneficiaries.map((beneficiary) => {
          return (
            <PaymentBeneficiaryItem
              key={beneficiary.id}
              beneficiary={beneficiary}
              currency={currency}
              isSelected={selectedBeneficiaryId === beneficiary.id}
              isEditing={editingBeneficiaryId === beneficiary.id}
              prompt={promptsByBeneficiary[beneficiary.id] ?? ''}
              draft={draftsByBeneficiary[beneficiary.id]}
              onSelect={() => onSelectBeneficiary(beneficiary.id)}
              onToggleInlineEditor={() => onToggleInlineEditor(beneficiary.id)}
              onPromptChange={(prompt) => onPromptChange(beneficiary.id, prompt)}
              onSuggestInlineEdit={() => onSuggestInlineEdit(beneficiary.id)}
              onApplyInlineEdit={() => onApplyInlineEdit(beneficiary.id)}
              onCloseInlineEditor={onCloseInlineEditor}
            />
          );
        })}
      </div>
    </div>
  );
}
