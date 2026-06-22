'use client';

import { ArrowRight, Sparkles, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ComplianceTab } from '../../hooks/useCompliance';
import type { ComplianceActionItem } from './data';

interface ComplianceActionCenterProps {
  actions: readonly ComplianceActionItem[];
  onSelectTab: (tab: ComplianceTab) => void;
}

export function ComplianceActionCenter({
  actions,
  onSelectTab,
}: ComplianceActionCenterProps): JSX.Element {
  return (
    <Card className="border-[var(--border-subtle)] bg-[var(--surface-1)]">
      <CardHeader className="border-b border-[var(--border-subtle)] px-5 py-4 sm:px-6">
        <CardTitle>Action Center</CardTitle>
        <CardDescription>Riesgo, evidencia y accion en la misma superficie.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 p-5 sm:p-6">
        {actions.map((item) => (
          <article
            key={item.id}
            className={cn(
              'rounded-[22px] border p-4 sm:p-5',
              item.priority === 'critical'
                ? 'ui-critical-surface'
                : item.priority === 'warning'
                  ? 'ui-warning-surface'
                  : 'ui-neutral-surface',
            )}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-primary)]">
                    <item.icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 py-1 text-label font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                        {item.priority === 'critical'
                          ? 'Bloqueante'
                          : item.priority === 'warning'
                            ? 'Atencion hoy'
                            : 'Seguimiento'}
                      </span>
                      <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 py-1 text-label font-medium text-[var(--text-secondary)]">
                        {item.metric}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
                        {item.title}
                      </h3>
                      <p className="text-sm font-medium text-[var(--text-secondary)]">
                        {item.summary}
                      </p>
                      <p className="text-sm leading-6 text-[var(--text-tertiary)]">{item.detail}</p>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-3">
                  <Button onClick={() => onSelectTab(item.tab)}>{item.actionLabel}</Button>
                </div>
              </div>

              <div className="ui-intelligence-chip rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="ui-intelligence-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                      Contexto del modelo
                    </p>
                    <p className="text-sm leading-6 text-[var(--text-secondary)]">{item.aiInsight}</p>
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
                      <span>{item.impact}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
