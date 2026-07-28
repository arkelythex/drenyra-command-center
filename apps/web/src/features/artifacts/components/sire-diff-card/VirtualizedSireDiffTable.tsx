import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import type { CurrencyCode, SireDiffRow } from "../../types/artifact.types";
import { SireDiffRowView } from "./SireDiffRow";
import { SireDiffToolbar } from "./SireDiffToolbar";
import type { RowDecision, RowDraft, SireStatusFilter } from "./types";

interface VirtualizedSireDiffTableProps {
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
	period: string;
}

const ROW_HEIGHT_ESTIMATE = 120; // approximate row height in px

export function VirtualizedSireDiffTable({
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
	period,
}: VirtualizedSireDiffTableProps) {
	const scrollRef = useRef<HTMLDivElement>(null);

	const virtualizer = useVirtualizer({
		count: visibleRows.length,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => ROW_HEIGHT_ESTIMATE,
		overscan: 5,
	});

	const virtualItems = virtualizer.getVirtualItems();

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

			<div ref={scrollRef} className="h-[600px] overflow-auto">
				<table className="min-w-full divide-y divide-border text-xs">
					<thead className="sticky top-0 z-10 bg-muted/50">
						<tr>
							<th className="px-3 py-2 text-left font-black uppercase tracking-wider">
								Estado
							</th>
							<th className="px-3 py-2 text-left font-black uppercase tracking-wider">
								Local
							</th>
							<th className="px-3 py-2 text-left font-black uppercase tracking-wider">
								SUNAT
							</th>
							<th className="px-3 py-2 text-left font-black uppercase tracking-wider">
								CPE
							</th>
							<th className="px-3 py-2 text-left font-black uppercase tracking-wider">
								Diferencia
							</th>
							<th className="px-3 py-2 text-left font-black uppercase tracking-wider">
								Motivo
							</th>
							<th className="px-3 py-2 text-left font-black uppercase tracking-wider">
								Acciones
							</th>
						</tr>
					</thead>
					<tbody>
						{/* Spacer for total virtual height */}
						{visibleRows.length > 0 ? (
						<tr>
							<td
								colSpan={7}
								style={{ height: virtualizer.getTotalSize(), padding: 0 }}
							>
								<div
									data-testid="virtualizer-inner"
									style={{
										position: "relative",
										width: "100%",
										height: virtualizer.getTotalSize(),
									}}
								>
									{virtualItems.map((virtualItem) => {
										const row = visibleRows[virtualItem.index];
										return (
											<div
												key={virtualItem.key}
												data-index={virtualItem.index}
												ref={virtualizer.measureElement}
												style={{
													position: "absolute",
													top: 0,
													left: 0,
													width: "100%",
													transform: `translateY(${virtualItem.start}px)`,
												}}
											>
												<table
											key={`inner-${virtualItem.key}`}
											className="min-w-full table-fixed"
										>
													<tbody>
														<SireDiffRowView
															row={row}
															currency={currency}
															period={period}
															isSelected={selectedRowId === row.id}
															decision={decisions[row.id] ?? "PENDING"}
															draft={draftsByRow[row.id]}
															isInlineEditorOpen={editingRowId === row.id}
															prompt={promptsByRow[row.id] ?? ""}
															onSelectRow={() => onSelectRow(row.id)}
															onAcceptSunat={() => onAcceptSunat(row.id)}
															onKeepLocal={() => onKeepLocal(row.id)}
															onToggleInlineEditor={() =>
																onToggleInlineEditor(row.id)
															}
															onPromptChange={(nextPrompt) =>
																onPromptChange(row.id, nextPrompt)
															}
															onSuggestInlineEdit={() =>
																onSuggestInlineEdit(row)
															}
															onApplyInlineEdit={() =>
																onApplyInlineEdit(row)
															}
															onCloseInlineEditor={onCloseInlineEditor}
														/>
													</tbody>
												</table>
											</div>
										);
									})}
								</div>
							</td>
						</tr>
						) : null}

						{visibleRows.length === 0 ? (
							<tr>
								<td
									className="px-3 py-5 text-center text-label uppercase tracking-wider text-muted-foreground"
									colSpan={7}
								>
									Sin filas para el filtro seleccionado.
								</td>
							</tr>
						) : null}
					</tbody>
				</table>
			</div>
		</div>
	);
}
