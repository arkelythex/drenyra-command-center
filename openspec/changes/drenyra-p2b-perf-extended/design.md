# Design — P2b: Extended Performance Optimization

## PR1: React rendering optimization (~300 lines)

1. Run React DevTools Profiler on dashboard
2. Add React.memo to list items
3. Move state down from layout to leaf components
4. Replace useEffect derivations with select
5. Add useDeferredValue for search

## PR2: Bundle code-splitting (~300 lines)

1. Convert all route imports to React.lazy
2. vite.config.ts manualChunks for heavy libs
3. Run vite-bundle-visualizer to verify targets

## PR3: Web vitals (~200 lines)

1. Install web-vitals, add reporting
2. Audit and fix useEffect cleanup gaps
3. Add content-visibility: auto to off-viewport sections
