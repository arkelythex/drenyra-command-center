/**
 * FEOS — useFeosAttention Hook
 *
 * React hooks for attention inbox and portfolio status.
 */

import { useState, useCallback } from "react";
import * as feosApi from "../api/feos.api";

export interface AttentionItem {
  id: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  workspaceId: string;
  companyId: string;
  timestamp: { iso: string; unix: number };
}

export interface PortfolioRollup {
  total: number;
  active: number;
  waiting: number;
  blocked: number;
  completed: number;
  failed: number;
  unknown: number;
}

export function useAttentionInbox() {
  const [items, setItems] = useState<AttentionItem[]>([]);
  const [rollup, setRollup] = useState<PortfolioRollup | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (organizationId: string) => {
    setLoading(true);
    try {
      const result = await feosApi.getAttentionInbox(organizationId);
      if (result) {
        setItems(result.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { items, rollup, fetch, loading };
}

export function usePortfolioStatus() {
  const [status, setStatus] = useState<{
    totalRollup: PortfolioRollup;
    attentionCount: number;
    criticalAttentionCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async (organizationId: string) => {
    setLoading(true);
    try {
      const result = await feosApi.getPortfolioStatus(organizationId);
      if (result) {
        setStatus({
          totalRollup: result.totalRollup,
          attentionCount: result.attentionCount,
          criticalAttentionCount: result.criticalAttentionCount,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { status, fetch, loading };
}
