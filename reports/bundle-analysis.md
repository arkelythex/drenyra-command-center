# Bundle Analysis — Web App

**Date:** 2026-07-09

## Current State

| Metric | Value |
|--------|-------|
| Web source files | 1712 |
| Route files | 64 |
| Lazy routes (lazyRouteComponent) | ~54 of 64 |
| Eager imports still active | 10 routes |

## Findings

Most routes already use TanStack Router's `lazyRouteComponent`.
Only 10 routes still have eager imports that should be converted.

## Recommendations

1. Convert remaining 10 eager imports to lazyRouteComponent
2. Run vite-bundle-visualizer for exact bundle size measurement
3. Set bundle budget targets per route chunk

This is lower priority than P2b estimated (most of the work is done).
