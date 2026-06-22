# ARKELYTHEX Web Autonomous Optimization — Verification Log

## External guidance checked on 2026-05-03

- React docs: `lazy`, `useTransition`, and `useMemo` guidance.
- TanStack Query docs: request waterfalls and render optimizations.
- TanStack Router docs: render optimizations and fine-grained subscriptions.
- web.dev: `prefers-reduced-motion` guidance.
- Vite docs/search: bundle/code-splitting guidance was reviewed as part of the optimization direction.

## Current local evidence

- Latest targeted implementation slice passed:
  - `bun run typecheck`
  - `bun run lint`
  - `bun run check:classnames`
  - `bun run test:run -- src/features/auth/__tests__/auth-flow.integration.test.tsx src/features/auth/components/__tests__/LoginForm.test.tsx`
  - `bun run test:run -- src/features/auth/hooks/__tests__/useAuth.test.ts src/features/auth/hooks/__tests__/useAuthSession.test.ts`
  - `bun run test:run -- src/features/banking/hooks/__tests__/useBanking.test.ts`
  - `bun run test:run -- src/features/bills/components/__tests__/BillsBoard.test.tsx src/features/customers/components/__tests__/customer-form-defaults.test.ts`
  - `bun run test:run -- src/features/dashboard/api/__tests__/dashboard.api.test.ts`
  - `bun run test:run -- src/features/payments/hooks/__tests__/usePayments.test.tsx`
  - `bun run test:run -- src/features/invoices/hooks/__tests__/useInvoicesQuery.test.tsx`
  - `bun run test:run -- src/features/dashboard/hooks/__tests__/useDashboardData.test.tsx`
  - `bun run test:run -- src/features/cognitive-hub/components/__tests__/ToolApprovalCard.test.tsx src/features/cognitive-hub/hooks/__tests__/useAccountingJobsCatalog.test.tsx`
  - `bun run test:run -- src/features/cognitive-hub/hooks/__tests__/useAccountingJobRuns.test.tsx`
  - `bun run test:run -- src/features/onboarding/components/demos/__tests__/conversation-bubble.test.tsx`
  - `bun run test:run -- src/features/auth/components/__tests__/SignupForm.test.tsx src/features/auth/lib/__tests__/register-corporate-user.test.ts`
  - `bun run test:run -- src/features/auth/components/__tests__/LoginForm.test.tsx src/features/auth/__tests__/auth-flow.integration.test.tsx src/features/auth/hooks/__tests__/useAuth.test.ts src/features/auth/hooks/__tests__/useAuthSession.test.ts src/features/auth/components/__tests__/SignupForm.test.tsx src/features/auth/lib/__tests__/register-corporate-user.test.ts`
  - `bun run test:run -- src/features/invoices/components/create-invoice/hooks/__tests__/useInvoiceForm.test.ts src/features/invoices/components/create-invoice/__tests__/InvoiceDateFields.test.tsx src/features/invoices/components/__tests__/InvoicesSummaryBoard.test.tsx src/features/invoices/hooks/__tests__/useInvoicesBoardController.test.ts src/features/invoices/hooks/__tests__/useInvoicesQuery.test.tsx src/features/dashboard/components/__tests__/DashboardView.test.tsx src/features/dashboard/hooks/__tests__/useDashboardData.test.tsx`
  - `bun run test:run` — 108 passed files, 1 skipped; 408 passed tests, 20 skipped.
  - `git diff --check`
- Latest broad build/bundle check passed:
  - `bun run build && bun run check:bundle`
  - Total JS: approximately `2080.23 KB`
  - Max chunk: approximately `275.86 KB`
  - Bundle budget: passed

## Final reviewer pass

- Sub-agent reviewer spawn was attempted but unavailable because the current session had already reached the agent thread limit.
- Local reviewer pass removed a risky simulated fiscal impact from `ToolApprovalCard`: production approval UI now avoids fake S/ amounts and fake IGV/detracción rules, and instead shows neutral pending-decision copy plus real control-plane metadata when available.
- Cognitive-hub block review also ensured accounting-job mutations invalidate both the base run list and the optional control-plane hydration cache, so approval/audit traces are not left stale after create/update/execute operations.
- Auth block review removed default demo credentials from `LoginForm`, exported and covered safe redirect resolution, and switched redirect tests to history state instead of mutating `window.location`.
- Dashboard/invoices block review changed invoice form default fiscal dates to local-calendar formatting instead of UTC serialization, preventing off-by-one issue/vencimiento dates around timezone boundaries.

## Known baseline issues

- Full `bun run test:run` is green as of 2026-05-03 after refreshing stale auth, banking, bills, dashboard, payments, invoices, customers, and cognitive-hub tests to current contracts.
- `LoginForm.test.tsx` passes with explicit empty-credential and redirect-safety coverage; `auth-flow.integration.test.tsx` passes with 1 intentionally skipped logout-error case.

## Next verification targets

- If `ConversationBubble` is changed:
  - Add or run onboarding/demo UI tests if available.
  - Run `bun run typecheck`, `bun run lint`, `git diff --check`.
- If auth form motion is changed:
  - Avoid relying on stale LoginForm placeholder tests until separately fixed.
  - Run type/lint/build and any updated targeted tests.
