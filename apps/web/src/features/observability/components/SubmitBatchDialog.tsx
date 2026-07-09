/**
 * SubmitBatchDialog — dialog for creating and submitting a new batch.
 *
 * Simplified version since the backend expects JSON payload (not multipart):
 * - Text area for invoice data (JSON array format)
 * - Visual file list before submission
 * - Loading and error states
 *
 * On success, closes dialog and invalidates batches query.
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, FileText, Loader2, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSubmitBatch } from "../hooks/useObservability";
import type { CreateBatchPayload } from "../types";

// ─── Props ───────────────────────────────────────────────────────────────────

export interface SubmitBatchDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	companyId: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface DraftInvoice {
	id: string;
	type: "image" | "pdf" | "xml";
	data: string;
	label: string;
}

function generateId(): string {
	return Math.random().toString(36).slice(2, 10);
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function SubmitBatchDialog({
	open,
	onOpenChange,
	companyId,
}: SubmitBatchDialogProps) {
	const queryClient = useQueryClient();
	const submitBatch = useSubmitBatch();

	const [invoices, setInvoices] = useState<DraftInvoice[]>([]);
	const [rawInput, setRawInput] = useState("");
	const [parseError, setParseError] = useState<string | null>(null);

	// Reset state when dialog opens/closes
	const handleOpenChange = useCallback(
		(next: boolean) => {
			if (!next) {
				// Delay reset so the close animation finishes
				setTimeout(() => {
					setInvoices([]);
					setRawInput("");
					setParseError(null);
				}, 200);
			}
			onOpenChange(next);
		},
		[onOpenChange],
	);

	// Parse raw JSON input into draft invoices
	const handleParse = useCallback(() => {
		setParseError(null);
		try {
			const parsed = JSON.parse(rawInput);
			if (!Array.isArray(parsed)) {
				setParseError("Input must be a JSON array of invoice objects.");
				return;
			}
			const drafts: DraftInvoice[] = parsed.map(
				(item: { type?: string; data?: string; label?: string }) => {
					const t = item.type ?? "image";
					return {
						id: generateId(),
						type: t === "pdf" ? "pdf" : t === "xml" ? "xml" : "image",
						data: item.data ?? "",
						label: item.label ?? `${t.toUpperCase()} invoice`,
					};
				},
			);
			if (drafts.length === 0) {
				setParseError("At least one invoice is required.");
				return;
			}
			if (drafts.length > 100) {
				setParseError("Maximum 100 invoices per batch.");
				return;
			}
			setInvoices(drafts);
			setRawInput("");
		} catch {
			setParseError("Invalid JSON. Use an array of { type, data } objects.");
		}
	}, [rawInput]);

	// Remove a draft invoice
	const removeInvoice = useCallback((id: string) => {
		setInvoices((prev) => prev.filter((i) => i.id !== id));
	}, []);

	// Submit the batch
	const handleSubmit = useCallback(async () => {
		if (invoices.length === 0) return;

		const payload: CreateBatchPayload = {
			companyId,
			invoices: invoices.map((inv) => ({
				type: inv.type,
				data: inv.data,
			})),
		};

		try {
			await submitBatch.mutateAsync(payload);
			queryClient.invalidateQueries({ queryKey: ["batches"] });
			handleOpenChange(false);
		} catch {
			// Error state is managed by the mutation
		}
	}, [invoices, companyId, submitBatch, queryClient, handleOpenChange]);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>New Batch</DialogTitle>
					<DialogDescription>
						Submit invoices for AI processing. Provide invoice data as a JSON
						array, then review and submit.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 pt-2">
					{/* Raw JSON input */}
					{invoices.length === 0 && (
						<div className="space-y-2">
							<Label className="text-xs text-[var(--text-secondary)]">
								Invoice Data (JSON array)
							</Label>
							<textarea
								className={cn(
									"w-full rounded-lg border border-[var(--border-subtle)]",
									"bg-[var(--surface-1)] p-3 font-mono text-xs",
									"text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]",
									"focus:outline-none focus:ring-1 focus:ring-[var(--accent)]",
									"min-h-[120px] resize-y",
								)}
								placeholder={
									'[\n  { "type": "image", "data": "base64...", "label": "Invoice 1" },\n  { "type": "pdf", "data": "base64..." }\n]'
								}
								value={rawInput}
								onChange={(e) => setRawInput(e.target.value)}
							/>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={handleParse}
									disabled={!rawInput.trim()}
									className="gap-1.5"
								>
									<Upload className="h-3.5 w-3.5" />
									Preview Invoices
								</Button>
							</div>
						</div>
					)}

					{/* Parse error */}
					{parseError && (
						<div className="flex items-start gap-2 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 p-3">
							<AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger)]" />
							<p className="text-xs text-[var(--color-danger)]">{parseError}</p>
						</div>
					)}

					{/* Invoice list */}
					{invoices.length > 0 && (
						<div className="space-y-2">
							<Label className="text-xs text-[var(--text-secondary)]">
								Invoices to Submit ({invoices.length})
							</Label>
							<div className="max-h-[200px] space-y-1.5 overflow-y-auto">
								{invoices.map((inv) => (
									<div
										key={inv.id}
										className={cn(
											"flex items-center justify-between rounded-lg",
											"bg-[var(--surface-2)]/50 px-3 py-2",
										)}
									>
										<div className="flex items-center gap-2">
											<FileText className="h-4 w-4 text-[var(--text-tertiary)]" />
											<span className="text-xs text-[var(--text-primary)]">
												{inv.label}
											</span>
											<span className="rounded bg-[var(--surface-3)] px-1.5 py-0.5 text-2xs font-mono uppercase text-[var(--text-tertiary)]">
												{inv.type}
											</span>
										</div>
										<button
											type="button"
											onClick={() => removeInvoice(inv.id)}
											className="rounded p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--color-danger)]"
										>
											<X className="h-3.5 w-3.5" />
										</button>
									</div>
								))}
							</div>

							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setInvoices([])}
									className="text-xs"
								>
									Clear All
								</Button>
							</div>
						</div>
					)}

					{/* Mutation error */}
					{submitBatch.isError && (
						<div className="flex items-start gap-2 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 p-3">
							<AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger)]" />
							<p className="text-xs text-[var(--color-danger)]">
								{submitBatch.error instanceof Error
									? submitBatch.error.message
									: "Failed to submit batch."}
							</p>
						</div>
					)}

					{/* Footer actions */}
					<div className="flex justify-end gap-2 pt-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleOpenChange(false)}
							disabled={submitBatch.isPending}
						>
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSubmit}
							disabled={invoices.length === 0 || submitBatch.isPending}
							className="gap-1.5"
						>
							{submitBatch.isPending ? (
								<>
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
									Submitting…
								</>
							) : (
								<>
									<Upload className="h-3.5 w-3.5" />
									Submit Batch ({invoices.length})
								</>
							)}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
