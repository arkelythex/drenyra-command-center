type ReviewDetailPanelModule = typeof import('./ReviewDetailPanel');

let reviewDetailPanelModulePromise: Promise<ReviewDetailPanelModule> | null = null;

export function loadReviewDetailPanelModule(): Promise<ReviewDetailPanelModule> {
  reviewDetailPanelModulePromise ??= import('./ReviewDetailPanel');
  return reviewDetailPanelModulePromise;
}

export function preloadReviewDetailPanel(): void {
  void loadReviewDetailPanelModule().catch(() => {
    reviewDetailPanelModulePromise = null;
  });
}
