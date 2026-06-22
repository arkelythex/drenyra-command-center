'use client';

import type { ReactElement } from 'react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { trackEvent } from '@/lib/monitoring';
import { Button } from '@/components/ui/button';
import { ReviewCockpitHeader } from './components/ReviewCockpitHeader';
import { ReviewEmptyState } from './components/ReviewEmptyState';
import { ReviewQueueList } from './components/ReviewQueueList';
import {
  loadReviewDetailPanelModule,
  preloadReviewDetailPanel,
} from './components/review-detail-panel-loader';
import { useReviewQueue } from './hooks/useReviewQueue';
import type { ReviewItem } from './types/review.types';

const ReviewDetailPanel = lazy(async () => {
  const mod = await loadReviewDetailPanelModule();
  return { default: mod.ReviewDetailPanel };
});

export function ReviewCockpitPage(): ReactElement {
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const {
    data: items = [],
    isLoading,
    isError,
    error,
    refetch,
    actionError,
    actionInFlight,
    isActionPending,
    approveDocument,
    rejectDocument,
    retryLastAction,
  } = useReviewQueue();

  useEffect(() => {
    if (!selectedItem || !items.length) return;
    const stillThere = items.some((i) => i.id === selectedItem.id);
    if (!stillThere) setSelectedItem(null);
  }, [items, selectedItem]);

  function handleConflictApproval(conflictKey: string): void {
    trackEvent('review_conflict_approved', {
      reviewItemId: selectedItem?.id ?? null,
      conflictKey,
    });
  }

  function handleConflictCorrection(
    conflictKey: string,
    correctedValue: unknown,
  ): void {
    trackEvent('review_conflict_corrected', {
      reviewItemId: selectedItem?.id ?? null,
      conflictKey,
      correctedValue,
    });
  }

  async function handleApproveDocument(documentId: string): Promise<void> {
    await approveDocument(documentId);
  }

  async function handleRejectDocument(documentId: string): Promise<void> {
    await rejectDocument(documentId);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background font-sans text-foreground">
      <ReviewCockpitHeader itemCount={items.length} />

      <main className="flex flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
            Cargando cola de revisión…
          </div>
        ) : isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
            <p className="text-sm font-semibold text-destructive">No se pudo cargar la cola</p>
            <p className="max-w-md text-xs text-muted-foreground">
              {error instanceof Error ? error.message : 'Error desconocido'}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                void refetch();
              }}
            >
              Reintentar carga
            </Button>
          </div>
        ) : (
          <>
            <ReviewQueueList
              items={items}
              selectedItemId={selectedItem?.id ?? null}
              onSelect={setSelectedItem}
              onItemIntent={preloadReviewDetailPanel}
            />
            <div className="relative flex flex-1 flex-col overflow-hidden bg-background">
              {selectedItem ? (
                <Suspense fallback={<ReviewDetailPanelFallback />}>
                  <ReviewDetailPanel
                    selectedItem={selectedItem}
                    onApprove={handleConflictApproval}
                    onCorrection={handleConflictCorrection}
                    onApproveDocument={handleApproveDocument}
                    onRejectDocument={handleRejectDocument}
                    actionError={
                      actionError && actionError.documentId === selectedItem.id
                        ? actionError
                        : null
                    }
                    isActionPending={
                      isActionPending && actionInFlight?.documentId === selectedItem.id
                    }
                    onRetryAction={retryLastAction}
                  />
                </Suspense>
              ) : (
                <ReviewEmptyState />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}


function ReviewDetailPanelFallback(): ReactElement {
  return (
    <div
      className="flex flex-1 flex-col overflow-hidden bg-background"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-1)] px-8 py-6">
        <div className="space-y-3">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="h-6 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-40 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="flex-1 space-y-6 p-8">
        <div className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
      <span className="sr-only">Cargando detalle de revisión</span>
    </div>
  );
}
