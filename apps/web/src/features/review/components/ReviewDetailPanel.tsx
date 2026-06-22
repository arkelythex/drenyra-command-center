'use client';

import type { ReactElement } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, BrainCircuit, Clock, XCircle } from 'lucide-react';
import { AgentHeartbeat } from '@/components/agentic/AgentHeartbeat';
import { ConflictDiffView } from '@/components/agentic/ConflictDiffView';
import { Button } from '@/components/ui/button';
import type { ReviewQueueActionError } from '../hooks/useReviewQueue';
import type { ReviewItem } from '../types/review.types';
import { ReviewEmptyState } from './ReviewEmptyState';

interface ReviewDetailPanelProps {
  selectedItem: ReviewItem | null;
  onApprove: (conflictKey: string) => void;
  onCorrection: (conflictKey: string, correctedValue: unknown) => void;
  onApproveDocument: (documentId: string) => Promise<void>;
  onRejectDocument: (documentId: string) => Promise<void>;
  actionError: ReviewQueueActionError | null;
  isActionPending: boolean;
  onRetryAction: () => Promise<void>;
}

export function ReviewDetailPanel({
  selectedItem,
  onApprove,
  onCorrection,
  onApproveDocument,
  onRejectDocument,
  actionError,
  isActionPending,
  onRetryAction,
}: ReviewDetailPanelProps): ReactElement {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        {selectedItem ? (
          <motion.div
            key={selectedItem.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex h-full flex-1 flex-col"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-1)] px-8 py-6">
              <div className="flex items-center gap-6">
                <div className="space-y-1">
                  <p className="text-2xs font-black uppercase tracking-widest text-muted-foreground opacity-40">
                    Expediente
                  </p>
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    {selectedItem.filename}
                  </h2>
                </div>
                <div className="h-8 w-px bg-border/60" />
                <div className="space-y-1 text-center">
                  <p className="text-2xs font-black uppercase tracking-widest text-muted-foreground opacity-40">
                    Confidence score
                  </p>
                  <p className="font-mono text-xl font-black text-primary">
                    {(selectedItem.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="rounded-full border-border/50 hover:bg-muted/40">
                  Re-analizar
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-danger-muted text-danger hover:bg-danger-muted"
                  disabled={isActionPending}
                  onClick={() => {
                    void onRejectDocument(selectedItem.id);
                  }}
                >
                  <XCircle size={14} className="mr-2" />
                  Rechazar
                </Button>
                <Button
                  className="rounded-full px-8 text-2xs font-black uppercase tracking-widest shadow-sm"
                  disabled={isActionPending}
                  onClick={() => {
                    void onApproveDocument(selectedItem.id);
                  }}
                >
                  Aprobar & Registrar <ArrowRight size={14} className="ml-2" />
                </Button>
              </div>
            </div>

            <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto p-8">
              {actionError ? (
                <div className="rounded-xl border border-warning-subtle bg-warning/10 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-warning">
                        <AlertTriangle size={14} />
                        Acción no completada
                      </p>
                      <p className="text-sm text-foreground">{actionError.message}</p>
                      {actionError.runbook ? (
                        <p className="text-xs text-muted-foreground">
                          Runbook:{" "}
                          <span className="font-mono font-semibold">
                            {actionError.runbook.id}
                          </span>
                          {actionError.runbook.title
                            ? ` · ${actionError.runbook.title}`
                            : ""}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      variant="outline"
                      disabled={isActionPending}
                      onClick={() => {
                        void onRetryAction();
                      }}
                    >
                      Reintentar
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                  <Clock size={14} /> Trazabilidad de agentes
                </h3>
                <AgentHeartbeat runId={selectedItem.id} />
              </div>

              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                  <BrainCircuit size={14} /> Sistema de arbitraje
                </h3>
                <ConflictDiffView
                  data={selectedItem.conflicts}
                  onApprove={onApprove}
                  onCorrection={onCorrection}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <ReviewEmptyState />
        )}
      </AnimatePresence>
    </div>
  );
}
