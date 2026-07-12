# Tasks — P2b: Extended Performance Optimization

## Review Workload Forecast

- Total: ~800 lines, 3 PRs
- Budget risk: Medium (PR2 bundle splitting may exceed 400 lines)

## PR1 — React rendering

- [ ] React DevTools Profiler audit on dashboard
- [ ] Add React.memo to sidebar items, thread list items
- [ ] Move fiscal state from AgenticLayout to leaf consumers
- [ ] Replace useEffect derivations with Query select()
- [ ] Add useDeferredValue to sidebar/thread search
- [ ] Verify 40%+ re-render reduction

## PR2 — Bundle code-splitting

- [ ] Identify all route imports in routeTree.gen.ts
- [ ] Convert to React.lazy()
- [ ] Configure vite manualChunks for heavy libs
- [ ] Run vite-bundle-visualizer
- [ ] Verify main entry < 150KB gzip

## PR3 — Web vitals + memory

- [ ] Install and configure web-vitals
- [ ] rg for useEffect with addEventListener/subscribe/setInterval without cleanup
- [ ] Fix all uncovered cleanup gaps
- [ ] Add content-visibility: auto to off-viewport sections
- [ ] Verify 0 regressions on typecheck + test
