import { useState } from "react";
import type { WorkspaceLayout } from "@drenyra/workspace-layout";

export function useWorkspaceLayout(_workspaceId: string) {
  const [layout, setLayout] = useState<WorkspaceLayout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveLayout = async (_layout: WorkspaceLayout) => {
    // TODO: connect to backend layout persistence
    setLayout(_layout);
  };

  return { layout, isLoading, error, saveLayout } as const;
}
