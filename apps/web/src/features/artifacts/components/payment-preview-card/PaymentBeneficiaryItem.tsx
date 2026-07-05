import { PencilLine, Sparkles } from "lucide-react";
import type {
	CurrencyCode,
	PaymentBeneficiary,
} from "../../types/artifact.types";
import { useInlineGhostSuggestion } from "../shared/useInlineGhostSuggestion";
import type { PaymentBeneficiaryDraft } from "./types";
import { buildPaymentInlineSuggestions, formatMoney } from "./utils";

interface PaymentBeneficiaryItemProps {
	beneficiary: PaymentBeneficiary;
	currency: CurrencyCode;
	isSelected: boolean;
	isEditing: boolean;
	prompt: string;
	draft?: PaymentBeneficiaryDraft;
	onSelect: () => void;
	onToggleInlineEditor: () => void;
	onPromptChange: (prompt: string) => void;
	onSuggestInlineEdit: () => void;
	onApplyInlineEdit: () => void;
	onCloseInlineEditor: () => void;
}

export function PaymentBeneficiaryItem({
	beneficiary,
	currency,
	isSelected,
	isEditing,
	prompt,
	draft,
	onSelect,
	onToggleInlineEditor,
	onPromptChange,
	onSuggestInlineEdit,
	onApplyInlineEdit,
	onCloseInlineEditor,
}: PaymentBeneficiaryItemProps) {
	const suggestions = buildPaymentInlineSuggestions(beneficiary);
	const { ghostSuggestion, ghostCompletion, acceptGhostSuggestion } =
		useInlineGhostSuggestion({
			value: prompt,
			suggestions,
		});

	return (
		<div
			onClick={onSelect}
			className={[
				"rounded-xl border px-3 py-2 text-xs transition-colors",
				isSelected
					? "border-primary/40 bg-primary/10"
					: "border-border bg-card/70 hover:border-primary/20 hover:bg-muted/70",
			].join(" ")}
		>
			<div className="flex items-center justify-between gap-2">
				<div className="min-w-0">
					<p className="truncate font-semibold text-foreground">
						{beneficiary.name}
					</p>
					<p className="truncate text-2xs text-muted-foreground">
						{beneficiary.bankAccount}
					</p>
				</div>

				<div className="flex items-center gap-2">
					<span className="font-black">
						{formatMoney(beneficiary.amount, currency)}
					</span>
					<button
						type="button"
						onClick={(event) => {
							event.stopPropagation();
							onToggleInlineEditor();
						}}
						className="inline-flex h-7 items-center rounded-lg border border-border bg-card/70 px-2 text-3xs font-black uppercase tracking-wider text-foreground hover:bg-muted/70"
					>
						<PencilLine size={11} className="mr-1" />
						Editar
					</button>
				</div>
			</div>

			{draft ? (
				<div className="mt-2 rounded-lg border border-primary/20 bg-primary/10 px-2 py-1.5">
					<p className="text-2xs font-semibold text-primary">{draft.note}</p>
					<p className="text-3xs uppercase tracking-wider text-primary/70">
						Riesgo: {draft.patch.riskLevel}
					</p>
				</div>
			) : null}

			{isEditing ? (
				<div className="mt-2 space-y-2 rounded-lg border border-primary/20 bg-primary/10 p-2">
					<div className="relative">
						{ghostSuggestion ? (
							<div className="pointer-events-none absolute inset-0 flex h-8 items-center px-2 text-2xs uppercase tracking-wider">
								<span className="invisible">{prompt}</span>
								<span className="text-muted-foreground/35">
									{ghostCompletion}
								</span>
							</div>
						) : null}
						<input
							type="text"
							aria-label="Editar beneficiario"
							value={prompt}
							onChange={(event) => onPromptChange(event.target.value)}
							onClick={(event) => event.stopPropagation()}
							onKeyDown={(event) => {
								if (event.key === "Tab") {
									const accepted = acceptGhostSuggestion();
									if (accepted) {
										event.preventDefault();
										onPromptChange(accepted);
										return;
									}
								}
								if (event.key === "Escape") {
									event.preventDefault();
									onCloseInlineEditor();
									return;
								}

								if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
									event.preventDefault();
									if (draft) {
										onApplyInlineEdit();
										return;
									}
									onSuggestInlineEdit();
									return;
								}

								if (event.key === "Enter") {
									event.preventDefault();
									onSuggestInlineEdit();
								}
							}}
							placeholder="Ej: ajusta a 3500.00"
							className="relative z-10 h-8 w-full rounded-md border border-primary/20 bg-card/70 px-2 text-2xs uppercase tracking-wider text-foreground placeholder:text-muted-foreground/70"
							autoFocus
						/>
					</div>

					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={onSuggestInlineEdit}
							className="inline-flex h-7 items-center rounded-lg border border-primary/30 bg-primary/20 px-2 text-3xs font-black uppercase tracking-wider text-primary"
						>
							<Sparkles size={11} className="mr-1" />
							Sugerir
						</button>

						{draft ? (
							<button
								type="button"
								onClick={onApplyInlineEdit}
								className="inline-flex h-7 items-center rounded-lg border border-[rgba(var(--premium-success-rgb),0.30)] bg-[rgba(var(--premium-success-rgb),0.20)] px-2 text-3xs font-black uppercase tracking-wider text-[var(--premium-success)]"
							>
								Aplicar
							</button>
						) : null}

						<button
							type="button"
							onClick={onCloseInlineEditor}
							className="h-7 rounded-lg border border-border bg-card/70 px-2 text-3xs font-black uppercase tracking-wider text-muted-foreground hover:bg-muted/70"
						>
							Cerrar
						</button>
					</div>
					<p className="text-3xs uppercase tracking-wider text-primary/75">
						Tab: autocompletar | Enter: sugerir | Cmd/Ctrl+Enter: aplicar
					</p>
				</div>
			) : null}
		</div>
	);
}
