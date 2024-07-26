/**
 * FEOS — WorkspaceDashboard Component
 *
 * Portfolio-level dashboard showing workspace status across companies.
 * Displays attention rollup, workspace state distribution, and quick actions.
 */

import React, { useEffect } from "react";
import { useAttentionInbox, usePortfolioStatus } from "../hooks/useFeosAttention";
import { useWorkspaceList } from "../hooks/useFeosWorkspace";

interface FeosWorkspaceDashboardProps {
  organizationId: string;
}

const STATE_COLORS: Record<string, string> = {
  active: "bg-blue-500",
  waiting: "bg-amber-500",
  blocked: "bg-red-500",
  completed: "bg-green-500",
  failed: "bg-gray-800",
  unknown: "bg-gray-400",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "border-red-500 bg-red-50",
  high: "border-amber-500 bg-amber-50",
  medium: "border-blue-500 bg-blue-50",
  low: "border-gray-300 bg-gray-50",
};

export function FeosWorkspaceDashboard({ organizationId }: FeosWorkspaceDashboardProps) {
  const { status, fetch: fetchStatus, loading: statusLoading } = usePortfolioStatus();
  const { items, fetch: fetchAttention, loading: attentionLoading } = useAttentionInbox();
  const { workspaces, fetch: fetchWorkspaces } = useWorkspaceList();

  useEffect(() => {
    fetchStatus(organizationId);
    fetchAttention(organizationId);
    fetchWorkspaces();
  }, [organizationId]);

  if (statusLoading && !status) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const rollup = status?.totalRollup;

  return (
    <div className="space-y-6">
      {/* Portfolio Rollup */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-lg font-semibold mb-4">FEOS Portfolio Overview</h2>

        {rollup && (
          <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
            <StatCard label="Total" value={rollup.total} color="bg-gray-100" />
            <StatCard label="Active" value={rollup.active} color="bg-blue-100 text-blue-800" />
            <StatCard label="Waiting" value={rollup.waiting} color="bg-amber-100 text-amber-800" />
            <StatCard label="Blocked" value={rollup.blocked} color="bg-red-100 text-red-800" />
            <StatCard label="Completed" value={rollup.completed} color="bg-green-100 text-green-800" />
            <StatCard label="Failed" value={rollup.failed} color="bg-gray-800 text-white" />
            <StatCard label="Unknown" value={rollup.unknown} color="bg-gray-100 text-gray-600" />
          </div>
        )}

        {status && (
          <div className="mt-3 flex gap-4 text-sm text-gray-600">
            <span>Attention items: <strong className="text-amber-700">{status.attentionCount}</strong></span>
            <span>Critical: <strong className="text-red-700">{status.criticalAttentionCount}</strong></span>
          </div>
        )}
      </div>

      {/* Workspace State Bar */}
      {rollup && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Workspace Distribution</h3>
          <div className="flex h-6 rounded-full overflow-hidden">
            {rollup.active > 0 && (
              <div className="bg-blue-500 text-xs text-white flex items-center justify-center"
                style={{ width: `${(rollup.active / Math.max(rollup.total, 1)) * 100}%` }}>
                {rollup.active}
              </div>
            )}
            {rollup.waiting > 0 && (
              <div className="bg-amber-500 text-xs text-white flex items-center justify-center"
                style={{ width: `${(rollup.waiting / Math.max(rollup.total, 1)) * 100}%` }}>
                {rollup.waiting}
              </div>
            )}
            {rollup.blocked > 0 && (
              <div className="bg-red-500 text-xs text-white flex items-center justify-center"
                style={{ width: `${(rollup.blocked / Math.max(rollup.total, 1)) * 100}%` }}>
                {rollup.blocked}
              </div>
            )}
            {rollup.completed > 0 && (
              <div className="bg-green-500 text-xs text-white flex items-center justify-center"
                style={{ width: `${(rollup.completed / Math.max(rollup.total, 1)) * 100}%` }}>
                {rollup.completed}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attention Inbox */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-lg font-semibold mb-4">
          Attention Inbox
          {items.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({items.length} items)
            </span>
          )}
        </h2>

        {attentionLoading && items.length === 0 ? (
          <div className="text-gray-400 text-sm">Loading attention items...</div>
        ) : items.length === 0 ? (
          <div className="text-gray-400 text-sm">No attention items. All workspaces healthy.</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded border-l-4 ${PRIORITY_COLORS[item.priority] ?? "border-gray-300"}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      item.priority === "critical" ? "bg-red-100 text-red-800" :
                      item.priority === "high" ? "bg-amber-100 text-amber-800" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {item.priority}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">{item.category}</span>
                    <h4 className="font-medium text-sm mt-1">{item.title}</h4>
                    <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workspace List */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-lg font-semibold mb-4">
          Workspaces ({workspaces.length})
        </h2>

        {workspaces.length === 0 ? (
          <div className="text-gray-400 text-sm">No workspaces yet.</div>
        ) : (
          <div className="space-y-2">
            {workspaces.slice(0, 10).map((ws) => (
              <div key={ws.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${STATE_COLORS[ws.state] ?? "bg-gray-300"}`} />
                  <div>
                    <span className="text-sm font-medium">{ws.label}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {ws.intent} · {ws.period.label}
                    </span>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                  {ws.state}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`p-3 rounded-lg text-center ${color}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-0.5">{label}</div>
    </div>
  );
}
