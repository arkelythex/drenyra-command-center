import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RecoverDialog({
  runId,
  open,
  onOpenChange,
}: {
  runId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [inputType, setInputType] = useState("image");
  const [inputData, setInputData] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [resultMsg, setResultMsg] = useState("");

  const handleRecover = useCallback(async () => {
    if (!inputData.trim()) return;
    setStatus("loading");
    try {
      const { api } = await import("@/lib/api");
      const { unwrap } = await import("@/lib/api-helpers");
      const body = { inputData: inputData.trim(), inputType };
      await unwrap(
        api.api.ai.swarm["cognitive-stream"].runs[":runId"].recover.post({
          params: { runId },
          body,
        }),
      );
      setStatus("success");
      setResultMsg("Recovery triggered successfully.");
    } catch (err) {
      setStatus("error");
      setResultMsg(err instanceof Error ? err.message : "Unknown error");
    }
  }, [runId, inputType, inputData]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setTimeout(() => setStatus("idle"), 200);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Recover Run</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-xs text-[var(--text-secondary)]">
              Input Type
            </Label>
            <Select value={inputType} onValueChange={setInputType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Image (base64)</SelectItem>
                <SelectItem value="pdf">PDF (base64)</SelectItem>
                <SelectItem value="xml">XML (text)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-[var(--text-secondary)]">
              Input Data
            </Label>
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 font-mono text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              rows={6}
              placeholder="Paste the original input data (base64 or text)..."
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
            />
          </div>
          {status === "success" && (
            <p className="text-xs font-medium text-[var(--color-success)]">
              {resultMsg}
            </p>
          )}
          {status === "error" && (
            <p className="text-xs font-medium text-[var(--color-danger)]">
              {resultMsg}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRecover}
              disabled={status === "loading" || !inputData.trim()}
              className="gap-1.5"
            >
              {status === "loading" ? "Recovering…" : <>Recover</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
