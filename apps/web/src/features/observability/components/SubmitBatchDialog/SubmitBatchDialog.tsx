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

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSubmitBatch } from "../../hooks/useObservability";
import { generateId } from "./SubmitBatchDialog.data";
import type { SubmitBatchDialogProps, DraftInvoice } from "./SubmitBatchDialog.types";
import type { CreateBatchPayload } from "../../types";
import { JsonInputSection } from "./components/JsonInputSection";
import { InvoiceListSection } from "./components/InvoiceListSection";
import { ErrorAlert } from "./components/ErrorAlert";
import { DialogActions } from "./components/DialogActions";

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

  const hasInvoices = invoices.length > 0;

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
          {/* Raw JSON input — shown only when no invoices are staged */}
          {!hasInvoices && (
            <JsonInputSection
              rawInput={rawInput}
              onRawInputChange={setRawInput}
              onParse={handleParse}
            />
          )}

          {/* Parse error */}
          {parseError && <ErrorAlert message={parseError} />}

          {/* Invoice list */}
          {hasInvoices && (
            <InvoiceListSection
              invoices={invoices}
              onRemove={removeInvoice}
              onClear={() => setInvoices([])}
            />
          )}

          {/* Mutation error */}
          {submitBatch.isError && (
            <ErrorAlert
              message={
                submitBatch.error instanceof Error
                  ? submitBatch.error.message
                  : "Failed to submit batch."
              }
            />
          )}

          {/* Footer actions */}
          <DialogActions
            invoiceCount={invoices.length}
            isSubmitting={submitBatch.isPending}
            onCancel={() => handleOpenChange(false)}
            onSubmit={handleSubmit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
