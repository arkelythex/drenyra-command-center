/**
 * FEOS — useFeosWorkspace Hook
 *
 * React hooks for workspace management.
 */

import { useState, useCallback } from "react";
import * as feosApi from "../api/feos.api";
import type { ApiResult } from "@/lib/api-factory";

export interface WorkspaceSummary {
  id: string;
  organizationId: string;
  companyId: string;
  period: { year: number; month: number; label: string };
  intent: string;
  label: string;
  state: string;
  isHealthy: boolean;
}

export function useWorkspaceCreate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (input: Parameters<typeof feosApi.createWorkspace>[0]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await feosApi.createWorkspace(input);
      return result;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create workspace";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}

export function useWorkspaceList() {
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (companyId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await feosApi.listWorkspaces(companyId);
      setWorkspaces(result?.workspaces ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to list workspaces");
    } finally {
      setLoading(false);
    }
  }, []);

  return { workspaces, fetch, loading, error };
}

export function useWorkspaceTransition() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transition = useCallback(async (id: string, action: string, params?: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await feosApi.transitionWorkspace(id, action, params);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to transition");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { transition, loading, error };
}
