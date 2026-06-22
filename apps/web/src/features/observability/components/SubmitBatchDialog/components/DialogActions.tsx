/**
 * DialogActions — Cancel and Submit buttons for the batch dialog.
 */

import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DialogActionsProps {
  invoiceCount: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function DialogActions({
  invoiceCount,
  isSubmitting,
  onCancel,
  onSubmit,
}: DialogActionsProps) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button
        size="sm"
        onClick={onSubmit}
        disabled={invoiceCount === 0 || isSubmitting}
        className="gap-1.5"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Submitting…
          </>
        ) : (
          <>
            <Upload className="h-3.5 w-3.5" />
            Submit Batch ({invoiceCount})
          </>
        )}
      </Button>
    </div>
  );
}
