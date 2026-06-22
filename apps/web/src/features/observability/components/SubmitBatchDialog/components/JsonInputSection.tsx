/**
 * JsonInputSection — textarea for raw JSON invoice data and a preview button.
 */

import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface JsonInputSectionProps {
  rawInput: string;
  onRawInputChange: (value: string) => void;
  onParse: () => void;
}

export function JsonInputSection({
  rawInput,
  onRawInputChange,
  onParse,
}: JsonInputSectionProps) {
  return (
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
        onChange={(e) => onRawInputChange(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onParse}
          disabled={!rawInput.trim()}
          className="gap-1.5"
        >
          <Upload className="h-3.5 w-3.5" />
          Preview Invoices
        </Button>
      </div>
    </div>
  );
}
