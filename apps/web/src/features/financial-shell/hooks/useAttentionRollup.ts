import { useState } from "react";
import type { AttentionRollup } from "../types";

export function useAttentionRollup(_workspaceId: string) {
  const [rollup, setRollup] = useState<AttentionRollup | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return { rollup, isLoading } as const;
}
