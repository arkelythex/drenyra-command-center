/**
 * FEOS — AttentionInbox Component
 *
 * Standalone attention inbox widget showing items that need attention.
 * Can be embedded in dashboards, sidebars, or the command center.
 */

import React, { useEffect, useState } from "react";
import * as feosApi from "../api/feos.api";

interface AttentionInboxProps {
  organizationId: string;
  compact?: boolean;
  maxItems?: number;
}

export function FeosAttentionInbox({ organizationId, compact = false, maxItems = 5 }: AttentionInboxProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feosApi.getAttentionInbox(organizationId).then((result) => {
      if (result) setItems(result.items ?? []);
    }).finally(() => setLoading(false));
  }, [organizationId]);

  const criticalCount = items.filter((i) => i.priority === "critical").length;
  const displayItems = items.slice(0, maxItems);

  if (loading) {
    return <div className="text-sm text-gray-400">Loading attention...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="text-sm text-green-600 flex items-center gap-1">
        <span>All clear</span>
        {!compact && <span className="text-gray-400">— no items need attention</span>}
      </div>
    );
  }

  return (
    <div className={compact ? "" : "space-y-2"}>
      {/* Summary bar */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">{items.length}</span>
        <span className="text-gray-500">attention items</span>
        {criticalCount > 0 && (
          <span className="ml-auto text-red-600 font-medium">{criticalCount} critical</span>
        )}
      </div>

      {/* Items list */}
      {!compact && (
        <div className="space-y-1">
          {displayItems.map((item: any) => (
            <div
              key={item.id}
              className="text-sm p-2 rounded border-l-2 hover:bg-gray-50 cursor-pointer"
              style={{ borderLeftColor: item.priority === "critical" ? "#ef4444" : item.priority === "high" ? "#f59e0b" : "#d1d5db" }}
            >
              <div className="flex justify-between">
                <span className="font-medium truncate">{item.title}</span>
                <span className="text-xs text-gray-400 ml-2">{item.category}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
            </div>
          ))}
          {items.length > maxItems && (
            <div className="text-xs text-blue-600 pt-1">
              +{items.length - maxItems} more items
            </div>
          )}
        </div>
      )}

      {/* Compact: just show colored dots */}
      {compact && (
        <div className="flex gap-1 mt-1">
          {items.slice(0, 3).map((item: any) => (
            <span
              key={item.id}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.priority === "critical" ? "#ef4444" : item.priority === "high" ? "#f59e0b" : "#d1d5db" }}
              title={item.title}
            />
          ))}
          {items.length > 3 && <span className="text-xs text-gray-400">+{items.length - 3}</span>}
        </div>
      )}
    </div>
  );
}
