# Specification — P2b: Extended Performance Optimization

## Requirement 1: React rendering optimization

Reduce unnecessary re-renders in dashboard, sidebar, and thread list.

**Acceptance criteria:**

- React.memo on pure list items
- State moved down to consumer components
- useEffect replaced with derived state/TanStack Query select where possible
- useDeferredValue for search inputs

## Requirement 2: Bundle code-splitting

Lazy-load feature routes and heavy libraries.

**Acceptance criteria:**

- React.lazy for all route imports
- pdf-lib, exceljs, chart libraries loaded on demand
- Main entry < 150KB gzip

## Requirement 3: Web vitals + memory leaks

**Acceptance criteria:**

- web-vitals library installed with FCP < 1.5s, LCP < 2.5s targets
- 0 memory leaks from uncleared subscriptions/timers
- CSS containment on off-viewport sections
