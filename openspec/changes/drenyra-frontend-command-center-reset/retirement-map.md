<!-- markdownlint-disable MD013 -->

# Retirement Map — Drenyra Frontend Command Center Reset

**Date:** 2026-07-09  
**Author:** el Gentleman  
**Inventory method:** CodeGraph + filesystem enumeration  
**Source:** `apps/web` (1089 `.ts`/`.tsx` files), `packages/ui`

---

## Classification legend

| Tag            | Meaning                                                        |
| -------------- | -------------------------------------------------------------- |
| **keep**       | Already aligns with agentic command-center model               |
| **refactor**   | Useful behavior but needs architecture/UI/pattern alignment    |
| **wrap**       | Keep as compatibility route behind command palette             |
| **quarantine** | Demo/mock/experimental/legacy surface removed from primary UX  |
| **delete**     | Unused or harmful legacy surface with safe removal evidence    |
| **merge**      | Duplicate concept that should merge into the canonical feature |

---

## 1. Routes

All 133 route files in `apps/web/src/routes/`.

### Auth and onboarding

| Route                  | Classification | Evidence                | Rationale                                           |
| ---------------------- | :------------: | ----------------------- | --------------------------------------------------- |
| `login.tsx`            |    **keep**    | Production auth surface | Core login                                          |
| `signup.tsx`           |    **keep**    | Production auth surface | Registration                                        |
| `auth.tsx`             |    **keep**    | Social OAuth callback   | OAuth flow                                          |
| `forgot-password.tsx`  |    **keep**    | Production auth surface | Password reset                                      |
| `reset-password.tsx`   |    **keep**    | Production auth surface | Reset form                                          |
| `verify-email.tsx`     |    **keep**    | Production auth surface | Email verification                                  |
| `onboarding.tsx`       |  **refactor**  | First-time user flow    | Needs agentic onboarding, not generic setup         |
| `onboarding.demos.tsx` | **quarantine** | Interactive demos       | Remove from primary UX; keep as demo reference only |

### Primary workspace routes

| Route                | Classification | Evidence                           | Rationale                                              |
| -------------------- | :------------: | ---------------------------------- | ------------------------------------------------------ |
| `__root.tsx`         |    **keep**    | Root layout with auth guard        | Foundation; will be refactored for new shell           |
| `index.tsx`          |  **refactor**  | Redirects to /dashboard            | Should redirect to inbox, not dashboard                |
| `dashboard.tsx`      |  **refactor**  | KPI/charts home                    | Transition to Accounting Inbox; keep as analytics view |
| `inbox.tsx`          |    **keep**    | Action inbox                       | Core command-center concept                            |
| `cierre-mensual.tsx` |    **keep**    | Monthly close                      | Flagship mission workspace candidate                   |
| `period-close.tsx`   |   **merge**    | Duplicate close concept            | Merge with `cierre-mensual.tsx`                        |
| `review-queue.tsx`   |    **keep**    | Approval queue                     | Core agentic workflow surface                          |
| `review.tsx`         |  **refactor**  | Document review                    | Needs risk + evidence inspector alignment              |
| `approvals.tsx`      |    **keep**    | Approval hub                       | Core command-center concept                            |
| `approval.$id.tsx`   |    **keep**    | Single approval detail             | Core command-center concept                            |
| `approval.tsx`       |   **delete**   | Appears unused (duplicate concept) | Verify before removal                                  |

### Client/company routes

| Route                  | Classification | Evidence      | Rationale             |
| ---------------------- | :------------: | ------------- | --------------------- |
| `firm.tsx`             |    **keep**    | Firm layout   | Client 360 foundation |
| `firm/index.tsx`       |    **keep**    | Firm home     | Client 360            |
| `firm/clients.tsx`     |    **keep**    | Client list   | Client 360            |
| `firm/clients.$id.tsx` |    **keep**    | Client detail | Client 360 detail     |

### Accounting module routes

| Route                             | Classification | Evidence              | Rationale                           |
| --------------------------------- | :------------: | --------------------- | ----------------------------------- |
| `contabilidad/ledger.tsx`         |    **keep**    | General ledger        | Core accounting surface             |
| `contabilidad/cierre-mensual.tsx` |   **merge**    | Duplicate close route | Merge with `cierre-mensual.tsx`     |
| `contabilidad/financials.tsx`     |    **keep**    | Financial drill-down  | Integration with mission workspace  |
| `contabilidad/reports.tsx`        |    **keep**    | Reports               | Keep as mission output              |
| `contabilidad/assets.tsx`         |  **refactor**  | Fixed assets          | Wrap behind mission/tools access    |
| `contabilidad/accounting-pr.tsx`  |    **wrap**    | Accounting PR view    | Legacy format; compatibility access |

### Settlement/banking routes

| Route                           | Classification | Evidence       | Rationale                                            |
| ------------------------------- | :------------: | -------------- | ---------------------------------------------------- |
| `tesoreria/banking.tsx`         |  **refactor**  | Banking module | Wrap behind command palette; reconcile from missions |
| `tesoreria/bills.tsx`           |  **refactor**  | Bills/payables | Wrap behind command palette                          |
| `tesoreria/cashflow.tsx`        |  **refactor**  | Cashflow       | Wrap behind command palette                          |
| `tesoreria/reconciliations.tsx` |    **keep**    | Reconciliation | Core mission surface                                 |

### Invoicing routes

| Route                          | Classification | Evidence       | Rationale                                                |
| ------------------------------ | :------------: | -------------- | -------------------------------------------------------- |
| `facturacion/invoices.tsx`     |  **refactor**  | Invoice Kanban | Wrap behind command palette; invoice review via missions |
| `facturacion/credit-notes.tsx` |  **refactor**  | Credit notes   | Wrap behind command palette                              |
| `facturacion/debit-notes.tsx`  |  **refactor**  | Debit notes    | Wrap behind command palette                              |

### Compliance routes

| Route                              | Classification | Evidence            | Rationale                       |
| ---------------------------------- | :------------: | ------------------- | ------------------------------- |
| `cumplimiento/compliance.tsx`      |    **keep**    | SUNAT compliance    | Core mission surface            |
| `cumplimiento/sunat-dashboard.tsx` |  **refactor**  | SUNAT viz           | Reframe as mission evidence     |
| `cumplimiento/sire-diff.tsx`       |    **keep**    | SIRE diff           | Core fiscal mission surface     |
| `cumplimiento/taxation.tsx`        |    **keep**    | Tax dashboard       | Core mission surface            |
| `cumplimiento/audit.tsx`           |    **keep**    | Audit trail         | Evidence vault surface          |
| `cumplimiento/review.tsx`          |  **refactor**  | Review              | Merge with `review.tsx` primary |
| `cumplimiento/expedientes.tsx`     |  **refactor**  | Dockets             | Wrap behind mission context     |
| `cumplimiento/approvals.tsx`       |   **merge**    | Duplicate approvals | Merge with `approvals.tsx`      |

### Operations routes

| Route                                      | Classification | Evidence            | Rationale                                 |
| ------------------------------------------ | :------------: | ------------------- | ----------------------------------------- |
| `operaciones/customers.tsx`                |  **refactor**  | Customer management | Wrap behind command palette               |
| `operaciones/vendors.tsx`                  |  **refactor**  | Vendor management   | Wrap behind command palette               |
| `operaciones/documents.tsx`                |  **refactor**  | Document management | Wrap behind command palette               |
| `operaciones/entities.tsx`                 |  **refactor**  | Entities            | Wrap behind command palette               |
| `operaciones/products.tsx`                 |  **refactor**  | Products            | Wrap behind command palette               |
| `operaciones/inventory.tsx`                |  **refactor**  | Inventory           | Wrap behind command palette               |
| `operaciones/inbox.tsx`                    |   **merge**    | Duplicate inbox     | Merge with primary `inbox.tsx`            |
| `operaciones/payroll.tsx`                  |  **refactor**  | Payroll             | Wrap behind command palette               |
| `operaciones/economic-groups.$groupId.tsx` |  **refactor**  | Economic groups     | Wrap behind command palette               |
| `operaciones/scanner.tsx`                  | **quarantine** | Scanner             | Demo/experimental; remove from primary UX |

### Workspace routes

| Route                        | Classification | Evidence             | Rationale                                 |
| ---------------------------- | :------------: | -------------------- | ----------------------------------------- |
| `workspace/index.tsx`        |  **refactor**  | Workspace hub        | Redesign for command-center mission model |
| `workspace/operations.tsx`   |  **refactor**  | Operations workspace | Needs mission alignment                   |
| `workspace/finance.tsx`      |  **refactor**  | Finance workspace    | Needs mission alignment                   |
| `workspace/compliance.tsx`   |  **refactor**  | Compliance workspace | Needs mission alignment                   |
| `workspace/system-admin.tsx` |  **refactor**  | System admin         | Needs command-center alignment            |

### Drenyra/AI routes

| Route                          | Classification | Evidence             | Rationale                          |
| ------------------------------ | :------------: | -------------------- | ---------------------------------- |
| `drenyra.tsx`                  |    **keep**    | Drenyra AI assistant | Core command-center concept        |
| `drenyra/index.tsx`            |    **keep**    | Drenyra home         | Core agent landing                 |
| `drenyra/hub.tsx`              |   **merge**    | Agent hub            | Merge with `drenyra/index.tsx`     |
| `drenyra/control-tower.tsx`    |  **refactor**  | Control tower        | Merge command-center concepts      |
| `drenyra/automatizaciones.tsx` |    **keep**    | Automations          | Core skill concept                 |
| `drenyra/skills.tsx`           |    **keep**    | Skills               | Core skill concept                 |
| `drenyra/herramientas.tsx`     |    **wrap**    | Tools page           | Legacy tools access                |
| `drenyra/case.$threadId.tsx`   |    **keep**    | Case/thread detail   | Core thread concept                |
| `drenyra/$threadId.tsx`        |    **keep**    | Thread detail        | Core thread concept                |
| `drenyra/observability.tsx`    |  **refactor**  | Observability        | Agent/ops surface for internal use |

### Thread routes

| Route                   | Classification | Evidence      | Rationale           |
| ----------------------- | :------------: | ------------- | ------------------- |
| `threads/index.tsx`     |    **keep**    | Threads list  | Core thread concept |
| `threads/$threadId.tsx` |    **keep**    | Thread detail | Core thread concept |

### Legacy/flat module routes

| Route                          | Classification | Evidence                | Rationale                                  |
| ------------------------------ | :------------: | ----------------------- | ------------------------------------------ |
| `invoices.tsx`                 |  **refactor**  | Invoice list            | Wrap behind command palette                |
| `banking.tsx`                  |  **refactor**  | Banking                 | Wrap behind command palette                |
| `bills.tsx`                    |  **refactor**  | Bills/payables          | Wrap behind command palette                |
| `cashflow.tsx`                 |  **refactor**  | Cashflow                | Wrap behind command palette                |
| `ledger.tsx`                   |  **refactor**  | Ledger                  | Core accounting, but flat route            |
| `financials.tsx`               |  **refactor**  | Financials              | Reframe as mission output                  |
| `reports.tsx`                  |  **refactor**  | Reports                 | Reframe as mission output                  |
| `taxation.tsx`                 |  **refactor**  | Taxation                | Reframe as mission surface                 |
| `compliance.tsx`               |  **refactor**  | Compliance              | Core surface but needs mission integration |
| `reconciliations.tsx`          |  **refactor**  | Reconciliations         | Core surface but needs mission integration |
| `audit.tsx`                    |  **refactor**  | Audit                   | Evidence vault surface                     |
| `compare.tsx`                  |  **refactor**  | Period compare          | Mission tool                               |
| `customers.tsx`                |  **refactor**  | Customers               | Wrap behind command palette                |
| `vendors.tsx`                  |  **refactor**  | Vendors                 | Wrap behind command palette                |
| `entities.tsx`                 |  **refactor**  | Entities                | Wrap behind command palette                |
| `products.tsx`                 |  **refactor**  | Products                | Wrap behind command palette                |
| `product-surfaces.tsx`         | **quarantine** | Product surfaces        | Experimental concept; quarantine           |
| `payroll.tsx`                  |  **refactor**  | Payroll                 | Wrap behind command palette                |
| `inventory.tsx`                |  **refactor**  | Inventory               | Wrap behind command palette                |
| `assets.tsx`                   |  **refactor**  | Assets                  | Wrap behind command palette                |
| `economic-groups.$groupId.tsx` |  **refactor**  | Economic groups         | Wrap behind command palette                |
| `documents.tsx`                |  **refactor**  | Docs                    | Wrap behind command palette                |
| `connections.tsx`              |  **refactor**  | Third-party connections | Wrap behind settings                       |
| `plugins.tsx`                  | **quarantine** | Plugin management       | Experimental; quarantine until needed      |
| `automations.tsx`              |    **keep**    | Automation rules        | Core command-center concept                |
| `skills.tsx`                   |    **keep**    | Skills library          | Core command-center concept                |
| `scanner.tsx`                  | **quarantine** | Document scanner        | Experimental; quarantine                   |
| `neural-grid.tsx`              | **quarantine** | Neural grid             | Visual experiment; quarantine              |
| `chat.tsx`                     |  **refactor**  | AI chat                 | Reframe as thread/agent workspace          |
| `fiscal-chat.tsx`              |  **refactor**  | Fiscal AI chat          | Reframe as thread/agent workspace          |
| `consulta.tsx`                 |  **refactor**  | Consulta                | Reframe as thread/agent workspace          |
| `inteligencia.tsx`             |  **refactor**  | Intelligence            | Reframe as investigation workspace         |
| `mobile-summary.tsx`           |  **refactor**  | Mobile summary          | Keep as mobile view but align with inbox   |
| `evidence.tsx`                 |    **keep**    | Evidence vault          | Core evidence concept                      |
| `evidence/$id.tsx`             |    **keep**    | Evidence detail         | Core evidence concept                      |
| `diffs/index.tsx`              |    **keep**    | Accounting diffs        | Core accounting diff concept               |
| `agents/index.tsx`             |    **keep**    | Agents window           | Core agentic concept                       |
| `playground.tsx`               | **quarantine** | Component playground    | Dev-only; quarantine                       |

### Configuracion routes

| Route                                  | Classification | Evidence              | Rationale                           |
| -------------------------------------- | :------------: | --------------------- | ----------------------------------- |
| `configuracion.tsx`                    |    **keep**    | Settings layout       | Core settings                       |
| `configuracion/index.tsx`              |    **keep**    | Settings home         | Core settings                       |
| `configuracion/organization.tsx`       |    **keep**    | Org profile/RUC       | Core settings                       |
| `configuracion/security.tsx`           |    **keep**    | Security/2FA          | Core settings                       |
| `configuracion/notifications.tsx`      |    **keep**    | Notifications         | Core settings                       |
| `configuracion/appearance.tsx`         |    **keep**    | Theme/preferences     | Core settings                       |
| `configuracion/integrations.tsx`       |    **keep**    | API integrations      | Core settings                       |
| `configuracion/billing.tsx`            |    **keep**    | Billing               | Core settings                       |
| `configuracion/profile.tsx`            |    **keep**    | User profile          | Core settings                       |
| `configuracion/connections.tsx`        |   **merge**    | Connect duplicate     | Merge with `connections.tsx`        |
| `configuracion/automations.tsx`        |   **merge**    | Automations duplicate | Merge with `automations.tsx`        |
| `configuracion/plugins.tsx`            | **quarantine** | Plugin settings       | Quarantine with plugins             |
| `configuracion/product-surfaces.tsx`   | **quarantine** | Surface settings      | Quarantine with product-surfaces    |
| `configuracion/compare.tsx`            |   **merge**    | Compare duplicate     | Merge with `compare.tsx`            |
| `configuracion/keyboard-shortcuts.tsx` |    **keep**    | Keyboard shortcuts    | Core settings                       |
| `configuracion/tool-permissions.tsx`   |  **refactor**  | Tool permissions      | Needs agent skill permissions model |

### Legacy flat config routes

| Route          | Classification | Evidence           | Rationale                      |
| -------------- | :------------: | ------------------ | ------------------------------ |
| `settings.tsx` |   **merge**    | Duplicate settings | Merge with `configuracion.tsx` |

### Agentic Shell routes

| Route                                  | Classification | Evidence            | Rationale                      |
| -------------------------------------- | :------------: | ------------------- | ------------------------------ |
| `accountant.tsx`                       |    **wrap**    | Accountant overview | Legacy; wrap                   |
| `credit-notes.tsx`                     |  **refactor**  | Credit notes        | Flat module route              |
| `debit-notes.tsx`                      |  **refactor**  | Debit notes         | Flat module route              |
| `popout.$threadId.tsx`                 |    **keep**    | Popout thread       | Useful for multi-monitor setup |
| `__tests__/-lazy-route-smoke.test.tsx` |    **keep**    | Smoke test          | Core test asset                |

### Summary

| Classification | Count | Effective action                             |
| -------------- | :---: | -------------------------------------------- |
| **keep**       |  42   | Preserve as-is                               |
| **refactor**   |  44   | Modernize behind missions or command palette |
| **wrap**       |   6   | Keep behind command palette, not primary nav |
| **merge**      |  12   | Combine into canonical route                 |
| **quarantine** |   9   | Remove from primary UX                       |
| **delete**     |   1   | Verify usage then remove                     |

---

## 2. Features

All 62 feature modules in `apps/web/src/features/`.

### Command-center native

| Feature                  | Classification | Evidence                               | Rationale                      |
| ------------------------ | :------------: | -------------------------------------- | ------------------------------ |
| `artifacts`              |    **keep**    | Artifact registry, factories, policies | Core evidence model            |
| `inbox`                  |    **keep**    | Action inbox                           | Accounting Inbox foundation    |
| `approval-hub`           |    **keep**    | Approval hub                           | Core approval surface          |
| `review-queue`           |    **keep**    | Review queue                           | Core review surface            |
| `review`                 |  **refactor**  | Document review                        | Needs risk/inspector alignment |
| `cierre-mensual`         |    **keep**    | Monthly close                          | Flagship mission workspace     |
| `reconciliations`        |    **keep**    | Reconciliation data/utils              | Core mission surface           |
| `diffs`                  |    **keep**    | Accounting diffs                       | Core diff concept              |
| `evidence`               |    **keep**    | Evidence vault                         | Core evidence concept          |
| `threads`                |    **keep**    | Thread workspace                       | Core agentic concept           |
| `agents`                 |    **keep**    | Agent operations                       | Core agentic concept           |
| `agents-window`          |    **keep**    | Agent window                           | Core agentic concept           |
| `agent-swarm`            |    **keep**    | Agent swarms                           | Core agentic concept           |
| `skills`                 |    **keep**    | Skills                                 | Core skill concept             |
| `drenyra`                |    **keep**    | Drenyra agent hooks                    | Core agent integration         |
| `drenyra-command-center` |   **merge**    | Duplicate command center               | Merge with `drenyra` feature   |
| `drenyra-workspace`      |   **merge**    | Duplicate workspace                    | Merge with workspace features  |
| `firm`                   |    **keep**    | Firm/client management                 | Client 360 foundation          |

### Accounting features to reframe as missions

| Feature               | Classification | Evidence                      | Rationale                                 |
| --------------------- | :------------: | ----------------------------- | ----------------------------------------- |
| `banking`             |  **refactor**  | Bank accounts, reconciliation | Mock data in hooks; needs mission surface |
| `bills`               |  **refactor**  | Bills/payables                | Wrap behind missions                      |
| `cashflow`            |  **refactor**  | Cashflow projections          | Wrap behind missions                      |
| `invoices`            |  **refactor**  | Invoice Kanban                | Tests exist; reframe as mission review    |
| `credit-notes`        |  **refactor**  | Credit notes                  | Wrap behind missions                      |
| `debit-notes`         |  **refactor**  | Debit notes                   | Wrap behind missions                      |
| `ledger`              |    **keep**    | General ledger                | Core accounting surface                   |
| `central-board`       |  **refactor**  | Central board                 | Duplicate ledger/approval concepts        |
| `compliance`          |    **keep**    | SUNAT/SIRE compliance         | Core compliance surface                   |
| `sire`                |   **merge**    | SIRE-specific                 | Merge into `compliance`                   |
| `sunat`               |   **merge**    | SUNAT-specific                | Merge into `compliance`                   |
| `taxation`            |    **keep**    | Tax dashboard                 | Core mission surface                      |
| `financials`          |  **refactor**  | Financial drill-down          | Mission output surface                    |
| `compare`             |  **refactor**  | Period comparison             | Mission tool                              |
| `report` → `reports`  |  **refactor**  | Custom reports                | Mission output surface                    |
| `accounting-pr`       |    **wrap**    | Accounting PR view            | Legacy format                             |
| `accountant-overview` |    **wrap**    | Accountant dash               | Legacy overview                           |
| `audit`               |    **keep**    | Audit trail                   | Evidence vault surface                    |
| `observability`       |  **refactor**  | Agent observability           | Ops surface                               |

### ERP-style module features

| Feature            | Classification | Evidence                | Rationale                   |
| ------------------ | :------------: | ----------------------- | --------------------------- |
| `customers`        |  **refactor**  | Customer management     | Wrap behind command palette |
| `vendors`          |  **refactor**  | Vendor management       | Wrap behind command palette |
| `entities`         |  **refactor**  | Entity registry         | Wrap behind command palette |
| `products`         |  **refactor**  | Product catalog         | Wrap behind command palette |
| `product-surfaces` | **quarantine** | Product surfaces        | Experimental                |
| `inventory`        |  **refactor**  | Inventory               | Wrap behind command palette |
| `assets`           |  **refactor**  | Fixed assets            | Wrap behind command palette |
| `payroll`          |  **refactor**  | Payroll                 | Wrap behind command palette |
| `economic-groups`  |  **refactor**  | Economic groups         | Wrap behind command palette |
| `expedientes`      |  **refactor**  | Dockets                 | Wrap behind command palette |
| `documents`        |  **refactor**  | Document management     | Wrap behind command palette |
| `connections`      |  **refactor**  | Third-party connections | Settings integration        |
| `plugins`          | **quarantine** | Plugin management       | Experimental                |
| `automations`      |    **keep**    | Automation rules        | Core command-center concept |

### AI/Chat/Demo features

| Feature         | Classification | Evidence              | Rationale                                    |
| --------------- | :------------: | --------------------- | -------------------------------------------- |
| `cognitive-hub` |   **merge**    | AI workspace          | Duplicate of agents/threads/drenyra concepts |
| `chat-agent`    |   **merge**    | Chat agent            | Merge into thread/agent workspace            |
| `fiscal-chat`   |   **merge**    | Fiscal chat           | Merge into thread/agent workspace            |
| `consulta`      |  **refactor**  | Consulta tool         | Mission tool                                 |
| `intelligence`  |  **refactor**  | Business intelligence | Mission output                               |
| `control-tower` |  **refactor**  | Control tower         | Merge command-center concepts                |
| `dashboard`     |  **refactor**  | Home dashboard        | Transition to Accounting Inbox               |
| `settings`      |    **keep**    | Settings              | Core settings                                |
| `auth`          |    **keep**    | Auth                  | Core auth                                    |
| `onboarding`    |  **refactor**  | Onboarding            | Needs agentic onboarding                     |
| `profile`       |    **keep**    | User profile          | Core profile                                 |
| `playground`    | **quarantine** | Component playground  | Dev-only                                     |

### Summary

| Classification | Count | Effective action       |
| -------------- | :---: | ---------------------- |
| **keep**       |  24   | Preserve               |
| **refactor**   |  20   | Modernize              |
| **merge**      |  12   | Combine duplicates     |
| **wrap**       |   2   | Compatibility access   |
| **quarantine** |   4   | Remove from primary UX |

---

## 3. Shell and layout

### Agentic shell (keep as foundation)

| Component           | Classification | Evidence                 | Rationale                |
| ------------------- | :------------: | ------------------------ | ------------------------ |
| `AgenticLayout`     |    **keep**    | Three-panel layout       | Promote to default shell |
| `AgenticSidebar`    |    **keep**    | Outcome navigation       | Primary nav foundation   |
| `AgenticCommandBar` |    **keep**    | Command entry            | Core agentic surface     |
| `WorkspaceSelector` |    **keep**    | Company/RUC/period scope | Core context selector    |

### Layout components

| Component                   | Classification | Evidence               | Rationale                                      |
| --------------------------- | :------------: | ---------------------- | ---------------------------------------------- |
| `MainLayout.tsx`            |  **refactor**  | Current default layout | Replace with AgenticLayout                     |
| `Sidebar.tsx`               |  **refactor**  | Current sidebar        | Replace with AgenticSidebar                    |
| `TopBar.tsx`                |  **refactor**  | Current top bar        | Replace or simplify                            |
| `BottomNavigationBar.tsx`   |  **refactor**  | Mobile nav             | Keep mobile, align with new nav                |
| `MobileTabNavigation.tsx`   |  **refactor**  | Mobile tabs            | Keep mobile, align with new nav                |
| `UserProfileDropdown.tsx`   |    **keep**    | User menu              | Core component                                 |
| `SidebarAccountMenu.tsx`    |  **refactor**  | Account in sidebar     | Align with new shell                           |
| `ActiveCompanySwitcher.tsx` |    **keep**    | Company/RUC switch     | Core context component                         |
| `FiscalInspector.tsx`       |  **refactor**  | Fiscal inspector       | Merge into RightInspector / Evidence Inspector |
| `HeaderSupportMenu.tsx`     |    **keep**    | Support                | Core utility                                   |
| `HeaderActivityCluster.tsx` |    **keep**    | Activity in header     | Core utility                                   |

### Agentic components

| Component              | Classification | Evidence              | Rationale          |
| ---------------------- | :------------: | --------------------- | ------------------ |
| `AgentPulse.tsx`       |    **keep**    | Agent pulse animation | Agent status UI    |
| `AgentHeartbeat.tsx`   |    **keep**    | Agent heartbeat       | Agent status UI    |
| `ConfidenceBadge.tsx`  |    **keep**    | AI confidence badge   | Core confidence UI |
| `ConflictDiffView.tsx` |    **keep**    | Diff visualizer       | Core diff UI       |
| `CommandPalette`       |    **keep**    | Command palette       | Core command UI    |

### Tests

| Path                | Classification | Evidence                | Rationale  |
| ------------------- | :------------: | ----------------------- | ---------- |
| `agentic/__tests__` |    **keep**    | Agentic component tests | Core tests |
| `layout/hooks/`     |    **keep**    | Layout hook tests       | Core tests |
| `__tests__`         |    **keep**    | Shared tests            | Core tests |

---

## 4. UI components

### `apps/web/src/components/ui` (keep + refactor)

Most ui components are shadcn/Radix primitives that should stay. Notable exceptions:

| Component                       | Classification | Evidence          | Rationale                                                     |
| ------------------------------- | :------------: | ----------------- | ------------------------------------------------------------- |
| `PageShell.tsx`                 |  **refactor**  | Page wrapper      | Uses CSS-variable arbitrary classes; align with design tokens |
| `glass-card.tsx`                |  **refactor**  | Glass effect      | Align with token system                                       |
| `liquid-glass.tsx`              |  **refactor**  | Liquid effect     | Align with token system                                       |
| `motion-primitives.tsx`         |  **refactor**  | Motion components | Consolidate with Framer Motion                                |
| `ComplexityModeToggle.tsx`      |  **refactor**  | Mode toggle       | Keep if UX modes remain                                       |
| `UXModeToggle.tsx`              |  **refactor**  | UX mode toggle    | Keep if UX modes remain                                       |
| `NavSection.tsx`, `NavItem.tsx` |  **refactor**  | Nav primitives    | Align with new sidebar                                        |
| `SurfaceCard.tsx`               |    **keep**    | Surface card      | Core visual                                                   |
| `SurfacePanel.tsx`              |    **keep**    | Surface panel     | Core visual                                                   |
| All others                      |    **keep**    | shadcn primitives | Core Radix/shadcn components                                  |

### `packages/ui/src` (keep as shared)

All 23 components are shared design-system primitives. Keep all.

Notable patterns:

- `Command.tsx` uses `forwardRef` (acceptable for cmdk interop)
- Many components use CSS variable patterns that should be aligned with token system over time

---

## 5. Stores

| Store                     | Classification | Evidence                   | Rationale                          |
| ------------------------- | :------------: | -------------------------- | ---------------------------------- |
| `ui-store.ts`             |    **keep**    | Theme, sidebar, rail state | Core UI state                      |
| `sidebar-layout.store.ts` |  **refactor**  | Sidebar state              | Align with new AgenticLayout       |
| `agentic-shell.store.ts`  |    **keep**    | Agentic workspace state    | Core shell state                   |
| `artifact-store.ts`       |    **keep**    | Artifact state             | Core artifact state                |
| `thread-store.ts`         |    **keep**    | Thread state               | Core thread state                  |
| `worktree-store.ts`       |    **keep**    | Worktree state             | Core worktree state                |
| `fiscal-case-store.ts`    |    **keep**    | Fiscal case state          | Core case state                    |
| `central-board-store.ts`  |   **merge**    | Board state                | Merge with artifact/approval state |
| `diff-approval-store.ts`  |    **keep**    | Diff approval              | Core diff state                    |
| `accounting-store.ts`     |    **keep**    | Accounting state           | Core accounting state              |
| `accounting-types.ts`     |    **keep**    | Accounting types           | Core types                         |

---

## 6. Context providers

| Provider                     | Classification | Evidence               | Rationale            |
| ---------------------------- | :------------: | ---------------------- | -------------------- |
| `SidebarContext` (to verify) |  **refactor**  | Sidebar open/close     | Align with new shell |
| `SidebarLayoutContext`       |  **refactor**  | Sidebar layout config  | Align with new shell |
| `SidebarWorkspaceContext`    |  **refactor**  | Workspace sidebar      | Align with new shell |
| `SettingsProvider`           |    **keep**    | App settings           | Core settings        |
| `SimulationContext`          | **quarantine** | Simulation mode        | Dev/demo; quarantine |
| `ArtifactEventContext`       |    **keep**    | Artifact event bus     | Core event bus       |
| `FiscalInspectorContext`     |    **keep**    | Fiscal inspector state | Core inspector state |
| `AgentAwareContext`          |    **keep**    | Agent awareness        | Core agentic context |

---

## 7. Hooks

| Hook                           | Classification | Evidence              | Rationale                |
| ------------------------------ | :------------: | --------------------- | ------------------------ |
| `useAdaptiveGlass.ts`          |  **refactor**  | Glass effect hook     | Align with design tokens |
| `useCodexKeyboardShortcuts.ts` |    **keep**    | Codex-style shortcuts | Core UX                  |
| `useHaptics.ts`                |  **refactor**  | Haptic feedback       | Mobile UX                |
| `useKeyboardShortcuts.ts`      |    **keep**    | Keyboard shortcuts    | Core UX                  |
| `useSoundUI.ts`                | **quarantine** | Sound effects         | Experimental; quarantine |

---

## 8. Code quality flags

### Mock data in production paths

| File                                                | Issue                                           |                     Classification                     |
| --------------------------------------------------- | ----------------------------------------------- | :----------------------------------------------------: |
| `apps/web/src/features/banking/hooks/useBanking.ts` | `MOCK_ACCOUNTS` fallback when API returns empty | **refactor** — quarantine mocks behind demo-only paths |
| `apps/web/src/context/SimulationContext.tsx`        | Simulation/demo event system                    |           **quarantine** — dev-only context            |

### React 19 patterns

| Pattern                        | Location                                 |                              Classification                              |
| ------------------------------ | ---------------------------------------- | :----------------------------------------------------------------------: |
| `forwardRef` for cmdks         | `packages/ui/src/components/Command.tsx` |              **keep** — acceptable for third-party interop               |
| Manual `useMemo`/`useCallback` | Various features                         | **refactor** — migrate to React Compiler where profiling confirms safety |

### Custom CSS variables as class values

| File                                       | Issue                                 |                             Classification                             |
| ------------------------------------------ | ------------------------------------- | :--------------------------------------------------------------------: |
| `apps/web/src/components/ui/PageShell.tsx` | `bg-[var(--surface-1)]` pattern       | **refactor** — replace with token classes when token system stabilizes |
| `packages/ui/src/components/Command.tsx`   | `bg-[var(--color-surface-1)]` pattern |                        **refactor** — as above                         |

---

## Priority action plan

### Phase 1 — Immediate (FE1: shell reset)

1. Promote `AgenticLayout` as default app layout
2. Demote `MainLayout`/`Sidebar`/`TopBar` to fallback
3. Verify all routes still render correctly in new shell

### Phase 2 — Immediate (FE2: inbox home)

1. Make `/inbox` the new default redirect from `/`
2. Keep `/dashboard` as secondary analytics route

### Phase 3 — Merge duplicates (12 routes, 12 features)

1. Merge `period-close.tsx` → `cierre-mensual.tsx`
2. Merge `contabilidad/cierre-mensual.tsx` → `cierre-mensual.tsx`
3. Merge `drenyra-command-center` → `drenyra` feature
4. Merge `drenyra-workspace` → workspace features
5. Merge `cognitive-hub`, `chat-agent`, `fiscal-chat` threads
6. Merge duplicate approval, review, inbox, settings routes

### Phase 4 — Quarantine (9 routes, 4 features)

1. Remove from primary nav: `playground`, `neural-grid`, `scanner`, `plugins`, `product-surfaces`, `onboarding.demos`, mobile-only demos
2. Remove from primary nav: `SimulationContext`, `useSoundUI`

### Phase 5 — Wrap (6 routes)

1. Move flat module routes behind command palette:

```text
/invoices → tools/invoices
/banking → tools/banking
/cashflow → tools/cashflow
/reports → tools/reports
/customers → tools/customers
/vendors → tools/vendors
```

### Phase 6 — Hardening (FE6)

1. Token alignment pass on UI components that use CSS variable arbitrary classes
2. Mock data quarantine: `useBanking`, `SimulationContext`
3. Bundle budget validation after quarantine removals
4. Test coverage for new shell and inbox surfaces
