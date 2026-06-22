import type { BatchRunDetail } from "../../types";

export interface BatchDetailProps {
  batch: BatchRunDetail;
  isLoading: boolean;
  onBack: () => void;
  onCancelBatch?: (batchId: string) => void;
}
