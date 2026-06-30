import { Link } from "@tanstack/react-router";
import {
	Check,
	FolderOpen,
	PencilLine,
	RotateCcw,
	Sparkles,
} from "lucide-react";
import { resolveSireExpedienteKind } from "@/features/sire/buildExpedienteEvidenceHref";
import type { CurrencyCode, SireDiffRow } from "../../types/artifact.types";
import { useInlineGhostSuggestion } from "../shared/useInlineGhostSuggestion";
import { SireDiffRecordCard } from "./SireDiffRecordCard";
import type { RowDecision, RowDraft } from "./types";
import {
	buildSireInlineSuggestions,
	formatCurrency,
	statusClass,
	statusLabel,
} from "./utils";

interface SireDiffRowProps {
	row: SireDiffRow;
	currency: CurrencyCode;
	period: string;
	isSelected: boolean;
	decision: RowDecision;
	draft?: RowDraft;
	isInlineEditorOpen: boolean;
	prompt: string;
	onSelectRow: () => void;
	onAcceptSunat: () => void;
	onKeepLocal: () => void;
	onToggleInlineEditor: () => void;
	onPromptChange: (nextPrompt: string) => void;
	onSuggestInlineEdit: () => void;
	onApplyInlineEdit: () => void;
	onCloseInlineEditor: () => void;
}

export function SireDiffRowView({
	row,
	currency,
	period,
	isSelected,
	decision,
	draft,
	isInlineEditorOpen,
	prompt,
	onSelectRow,
	onAcceptSunat,
	onKeepLocal,
	onToggleInlineEditor,
	onPromptChange,
	onSuggestInlineEdit,
	onApplyInlineEdit,
	onCloseInlineEditor,
}: SireDiffRowProps) {
	const rowTone =
		row.status === "MATCH"
			? "bg-[rgba(var(--premium-success-rgb),0.05)]"
			: row.status === "MISMATCH"
				? "bg-amber-500/5"
				: "bg-red-500/5";
	const rowSelectionTone = isSelected
		? "ring-1 ring-inset ring-primary/35"
		: "";
	const inlineSuggestions = buildSireInlineSuggestions(row);
	const documentSeries =
		row.localRecord?.series ?? row.sunatRecord?.series ?? row.cpeRecord?.series;
	const documentNumber =
		row.localRecord?.number ?? row.sunatRecord?.number ?? row.cpeRecord?.number;
	const documentRef =
		documentSeries && documentNumber
			? `${documentSeries}-${documentNumber}`
			: undefined;
	const { ghostSuggestion, ghostCompletion, acceptGhostSuggestion } =
		useInlineGhostSuggestion({
			value: prompt,
			suggestions: inlineSuggestions,
		});

	return (
		<tr
			className={`align-top ${rowTone} ${rowSelectionTone}`}
			onClick={onSelectRow}
		>
			<td className="px-3 py-3">
				<span
					className={`inline-flex rounded-md border px-2 py-1 text-3xs font-black uppercase tracking-wider ${statusClass(row.status)}`}
				>
					{statusLabel(row.status)}
				</span>
			</td>

			<td className="px-3 py-3">
				<SireDiffRecordCard
					record={row.localRecord}
					currency={currency}
					draftTotal={draft?.localTotal}
				/>
			</td>
			<td className="px-3 py-3">
				<SireDiffRecordCard
					record={row.sunatRecord}
					currency={currency}
					draftTotal={draft?.sunatTotal}
				/>
			</td>
			<td className="px-3 py-3">
				<SireDiffRecordCard record={row.cpeRecord} currency={currency} />
			</td>

			<td
				className={
					row.difference === 0
						? "px-3 py-3 text-muted-foreground"
						: "px-3 py-3 font-black text-amber-200"
				}
			>
				{formatCurrency(row.difference, currency)}
			</td>

			<td className="px-3 py-3 text-muted-foreground">
				<p>{row.reason}</p>
				{draft ? (
					<p className="mt-1 text-2xs font-semibold text-primary">
						{draft.note}
					</p>
				) : null}
				{draft?.patches?.length ? (
					<p className="mt-1 text-2xs uppercase tracking-wide text-primary/80">
						Diff IA: {draft.patches.length} patch
						{draft.patches.length === 1 ? "" : "es"}
					</p>
				) : null}
			</td>

			<td className="px-3 py-3">
				<div className="flex flex-col gap-2">
					<button
						type="button"
						onClick={onAcceptSunat}
						className="inline-flex h-7 items-center rounded-lg border border-primary/30 bg-primary/20 px-2 text-2xs font-black uppercase tracking-wider text-primary"
					>
						<Check size={12} className="mr-1" />
						Aceptar SUNAT
					</button>

					<button
						type="button"
						onClick={onKeepLocal}
						className="inline-flex h-7 items-center rounded-lg border border-border bg-card/70 px-2 text-2xs font-black uppercase tracking-wider text-foreground hover:bg-muted/70"
					>
						<RotateCcw size={12} className="mr-1" />
						Mantener Local
					</button>

					<button
						type="button"
						onClick={onToggleInlineEditor}
						className="inline-flex h-7 items-center rounded-lg border border-border bg-card/70 px-2 text-2xs font-black uppercase tracking-wider text-foreground hover:bg-muted/70"
					>
						<PencilLine size={12} className="mr-1" />
						IA Inline Edit
					</button>

					{draft ? (
						<button
							type="button"
							onClick={onApplyInlineEdit}
							className="inline-flex h-7 items-center rounded-lg border border-[rgba(var(--premium-success-rgb),0.30)] bg-[rgba(var(--premium-success-rgb),0.20)] px-2 text-2xs font-black uppercase tracking-wider text-[var(--premium-success)]"
						>
							<Sparkles size={12} className="mr-1" />
							Aplicar sugerencia
						</button>
					) : null}

					<span className="inline-flex rounded-md border border-border bg-muted/40 px-2 py-1 text-3xs font-black uppercase tracking-wider text-muted-foreground">
						{decision}
					</span>

					<Link
						to="/cumplimiento/expedientes"
						search={{
							periodo: period,
							kind: documentSeries
								? resolveSireExpedienteKind(documentSeries)
								: undefined,
							q: documentRef,
						}}
						onClick={(event) => event.stopPropagation()}
						className="inline-flex h-7 items-center rounded-lg border border-border bg-card/70 px-2 text-2xs font-black uppercase tracking-wider text-foreground hover:bg-muted/70"
					>
						<FolderOpen size={12} className="mr-1" />
						Evidencia
					</Link>

					{isInlineEditorOpen ? (
						<div className="space-y-2 rounded-lg border border-primary/20 bg-primary/10 p-2">
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
									value={prompt}
									onChange={(event) => onPromptChange(event.target.value)}
									onClick={(event) => event.stopPropagation()}
									aria-label="Editar celda SIRE"
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
										if (
											(event.metaKey || event.ctrlKey) &&
											event.key === "Enter"
										) {
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
									placeholder="Ej: ajusta SUNAT a 4550.00"
									className="relative z-10 h-8 w-full rounded-md border border-primary/20 bg-card/70 px-2 text-2xs uppercase tracking-wider text-foreground placeholder:text-muted-foreground/70"
									autoFocus
								/>
							</div>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={onSuggestInlineEdit}
									className="inline-flex h-7 items-center rounded-lg border border-primary/30 bg-primary/20 px-2 text-3xs font-black uppercase tracking-wider text-primary"
								>
									<Sparkles size={11} className="mr-1" />
									Sugerir
								</button>
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
			</td>
		</tr>
	);
}
