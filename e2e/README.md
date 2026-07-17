---
last-verified: 2026-06-14
source-of-truth: e2e/
auto-generated: false
---

# E2E Testing — ARKELYTHEX

**Last Updated:** 2026-06-14  
**Status:** Active  

*Alineado con la [Filosofía Gentleman](../docs/meta/gentleman-philosophy.md) de ARKELYTHEX — documentación clara, progresiva y que trata cada lector como un colega.*  
**Tech Stack:** Playwright, TypeScript, Page Object Model  
**Test Count:** 15 spec files, ~55 tests

---

## Overview

End-to-end (E2E) tests verify critical user journeys in the ARKELYTHEX web
application using Playwright. These tests simulate real browser interactions and
ensure the full stack works correctly — from frontend UI to backend API.

Two test patterns are used:

| Pattern | Description | When to use |
|:--------|:------------|:------------|
| **Authenticated** | Logs in via UI with `authenticate()` helper | Feature tests that need real backend interaction |
| **Mocked** | Intercepts API calls and seeds localStorage | Smoke tests that verify pages render without a backend |

---

## Tech Stack

| Component | Technology |
|:----------|:-----------|
| Test Runner | Playwright ^1.44 |
| Language | TypeScript ^6.0 |
| Pattern | Page Object Model (POM) |
| Utils | `@arkelythex/test-utils/e2e` |
| Report | HTML (Playwright built-in) |

---

## Configuration

Located in `playwright.config.ts` at project root:

| Setting | CI Value | Local Value |
|:--------|:---------|:------------|
| Browser | Chromium | Chromium + Chromium Mobile |
| Base URL | `BASE_URL` env or `http://localhost:5173` | Same |
| Retries | 2 | 0 |
| Workers | 1 | Unlimited (parallel) |
| Default timeout | 60 s | 30 s |
| Assertion timeout | 15 s | 15 s |
| Screenshots | On failure only | On failure only |
| Video | Retain on failure | Retain on failure |
| Trace | On first retry | On first retry |
| Global setup | `e2e/global-setup.ts` | `e2e/global-setup.ts` |

The web server starts automatically before tests:

```typescript
webServer: {
  command: "bun run --cwd apps/web dev -- --host 127.0.0.1 --port 5173 --strictPort",
  url: BASE_URL,
  reuseExistingServer: !CI,  // false in CI to ensure fresh server
  timeout: 120_000,          // 2 minutes
}
```

---

## Directory Structure

```
e2e/
├── base-test.ts                  # Base test configuration & fixtures
├── global-setup.ts               # Pre-suite validation & setup
├── global-teardown.ts            # Post-suite summary
├── README.md                     # This file
│
├── auth/                         # Authentication flows
│   └── sign-in.spec.ts           #   Login, logout, invalid creds (4 tests)
│
├── banking/                      # Banking operations
│   └── reconciliation.spec.ts    #   Bank accounts, reconciliation (5 tests)
│
├── cognitive-hub/                # AI chat workspace
│   └── chat-smoke.spec.ts        #   Chat workspace loads (1 test)
│
├── customers/                    # Customer management
│   └── customers.spec.ts         #   CRUD, search, validation (4 tests)
│
├── dashboard/                    # Dashboard & home page
│   └── dashboard.spec.ts         #   KPIs, summaries, date filter (4 tests)
│
├── drenyra-command-center/       # Drenyra Fiscal Command Center
│   └── drenyra-command-center.spec.ts  #   Full command center smoke (7 tests)
│
├── drenyra-workspace/            # Drenyra workspace navigation
│   ├── agent-workspaces.spec.ts       #   Agent workspace pages (7 tests)
│   └── workspace-navigation.spec.ts   #   Shell & sub-route smoke (3 tests) 🆕
│
├── facturacion/                  # Spanish-route billing pages 🆕
│   └── invoice-page.spec.ts      #   Invoices, credit/debit notes (3 tests) 🆕
│
├── invoices/                     # Invoice management
│   └── invoices.spec.ts          #   Create, validate, draft (4 tests)
│
├── reports/                      # Financial reports
│   └── reports.spec.ts           #   Balance sheet, P&L, exports (5 tests)
│
├── review/                       # Document review workflow
│   ├── review-helpers.ts         #   Shared mock helpers
│   └── review-supervisor.spec.ts #   Approve/reject flow (3 tests)
│
├── settings/                     # User & company settings
│   ├── appearance-theme.spec.ts  #   Light/dark theme switch (2 tests)
│   └── company-settings.spec.ts  #   Company details, tabs (4 tests)
│
└── tesoreria/                    # Spanish-route treasury pages 🆕
    └── banking-page.spec.ts      #   Banking, bills, cashflow (4 tests) 🆕
```

### Tag Convention

Tests use tags for filtering and CI orchestration:

| Tag | Purpose |
|:----|:--------|
| `@smoke` | Quick smoke tests (fast, no backend needed) |
| `@e2e` | Full E2E test |
| `@drenyra` | Drenyra workspace feature |
| `@tesoreria` | Treasury / banking feature |
| `@facturacion` | Invoicing feature |
| `@critical` | Critical path (fails = release blocker) |

Run by tag:

```bash
bun playwright test --grep "@smoke"
```

---

## Fixtures

The base test (`e2e/base-test.ts`) exports a custom `test` fixture with
`basePage`:

```typescript
import { test, expect } from './base-test';

test('should login successfully', async ({ basePage }) => {
  await basePage.navigate('/login');
  await basePage.assertUrl('/login');
});
```

### Available Fixtures

| Fixture | Source | Purpose |
|:--------|:-------|:--------|
| `basePage` | `BasePage` class | Common page interactions |
| `authenticate` | `@arkelythex/test-utils/e2e` | UI-based login |
| `testCredentials` | `@arkelythex/test-utils/e2e` | Predefined test users |

---

## Authentication in Tests

### 1. Authenticated pattern (real backend needed)

```typescript
import { test, expect } from '../base-test';
import { authenticate, testCredentials } from '@arkelythex/test-utils/e2e';

test('admin workflow', async ({ page }) => {
  await authenticate(page, testCredentials.admin);
  await page.goto('/invoices');
  await expect(page.locator('h1')).toContainText('Facturas');
});
```

### 2. Mocked pattern (no backend needed) — recommended for smoke tests

```typescript
import { test, expect } from '../base-test';

test.beforeEach(async ({ page }) => {
  // Seed localStorage with active company
  await page.addInitScript(() => {
    localStorage.setItem('arkelythex-active-company', JSON.stringify({
      companyId: '...',
      companyName: 'ARKELYTHEX S.A.C.',
      ruc: '20546296564',
      countryCode: 'pe',
      isDemoFallback: false,
    }));

    // Intercept auth session and API calls
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/auth/session')) {
        return Promise.resolve(new Response(JSON.stringify({...})));
      }
      if (url.includes('/api/')) {
        return Promise.resolve(new Response(JSON.stringify({ data: {} })));
      }
      return originalFetch(input, init);
    } as typeof window.fetch;
  });
});

test('page loads with heading', async ({ page }) => {
  await page.goto('/facturacion/invoices');
  await expect(page.getByRole('heading', { name: /factur/i })).toBeVisible();
});
```

### When to use each pattern

| Situation | Pattern |
|:----------|:--------|
| Smoke test (CI, no backend) | **Mocked** — route interception + localStorage |
| Full feature test with data | **Authenticated** — real login + backend |
| Drenyra workspace tests | **Mocked** — consistent with existing convention |
| Login flow testing | **Manual** — test the actual login UI |

---

## Writing a New Test

### Quick smoke test (no backend)

```typescript
// e2e/mi-feature/mi-feature.spec.ts
import { test, expect } from '../base-test';

test.describe('Mi Feature — smoke', () => {
  test('page loads with key UI', async ({ page }) => {
    // 1. Mock auth & API (reuse seed helper or inline)
    // 2. Navigate to route
    // 3. Assert heading / critical elements
    // 4. Assert no redirect to /login
  });
});
```

### Full feature test (with backend)

```typescript
// e2e/mi-feature/mi-feature.spec.ts
import { test, expect } from '../base-test';
import { authenticate, testCredentials } from '@arkelythex/test-utils/e2e';

test.describe('Mi Feature', () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page, testCredentials.admin);
  });

  test('creates a new record', async ({ page }) => {
    // Arrange → Act → Assert
  });
});
```

### Guidelines for smoke tests

1. **One assertion per page load** — heading or critical element
2. **Use `getByRole` / `getByText`** — avoid fragile CSS selectors
3. **Test the Spanish route** (e.g., `/facturacion/invoices`) in separate files
4. **Tag with `@smoke`** for quick CI filtering

---

## Running Tests

### All E2E Tests

```bash
bun test:e2e
```

### Single Domain

```bash
bun test:e2e auth
bun test:e2e invoices
```

### By Tag

```bash
npx playwright test --grep "@smoke"
```

### With UI Mode (Interactive)

```bash
bun test:e2e:ui
```

### Headed Mode (See Browser)

```bash
npx playwright test --headed
```

### Specific Project

```bash
npx playwright test --project=chromium
npx playwright test --project=chromium-mobile --grep "@mobile"
```

### Trace Viewer (After Failure)

```bash
# Opens HTML report with trace
bun playwright show-report
```

### Repeat to Detect Flakiness

```bash
npx playwright test --repeat-each=5 --grep "@smoke"
```

---

## CI Behavior

| Setting | Value | Reason |
|:---------|:------|:-------|
| Browser | Chromium | No WebKit/Firefox to save CI time |
| Workers | 1 | No parallelization |
| Retries | 2 | Flake tolerance |
| Timeout | 60 s | Slower CI runners |
| Screenshots | On failure | Debug only |
| Video | On failure | Debug only |

CI workflow:

1. Installs dependencies (`bun install`)
2. Runs Playwright browser install (`npx playwright install chromium`)
3. Starts web server (`bun run --cwd apps/web dev`)
4. Runs `npx playwright test`
5. Uploads artifacts: screenshots, videos, HTML report

---

## Troubleshooting

### Web Server Timeout

```bash
# Check if server is running
curl http://localhost:5173

# Increase timeout in playwright.config.ts
webServer: { timeout: 180_000 }
```

### Flaky Tests

```bash
# Identify flakiness locally
npx playwright test --retries=3
npx playwright test --repeat-each=5 --grep "@smoke"

# Common causes:
# - Missing await before assertions
# - Selectors that match multiple elements
# - Race conditions with SPA lazy loading
# - API timing (add explicit waitForResponse)
```

### Base URL Issues

```bash
export BASE_URL=http://localhost:5173
bun test:e2e
```

### Authentication Failures

```typescript
import { testCredentials } from '@arkelythex/test-utils/e2e';
console.log(testCredentials.admin);
// { email, password, role }
```

### Artifacts

```bash
ls test-results/screenshots/
ls test-results/videos/
ls test-results/html/  # Open index.html in browser
```

---

## Best Practices

1. **Prefer smoke tests first** — Mocked, fast, reliable. Add full feature
   tests only when smoke tests pass.
2. **Use `getByRole` over `data-testid`** — `getByRole` matches how users
   interact. Use `data-testid` only when no semantic role exists.
3. **No hardcoded waits** — Never `page.waitFor(2000)`. Use auto-waiting
   assertions or `waitForURL`/`waitForResponse`.
4. **One thing per test** — Don't test create AND edit AND delete in one test.
5. **Clean up in `afterEach`** — Clear localStorage, close modals.
6. **Tag consistently** — `@smoke` for quick checks, `@e2e` for full flows,
   domain tags for filtering.

---

## References

- [Playwright Docs](https://playwright.dev/)
- [Testing Architecture Skill](./../.opencode/skills/testing-architecture/SKILL.md)
- [Playwright Best Practices Skill](./../.agents/skills/playwright-best-practices/SKILL.md)
- [@arkelythex/test-utils](./../packages/test-utils/src/e2e/index.ts)
