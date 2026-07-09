# Type Duplication Audit — July 2026

**Generated:** 2026-07-09
**Tool:** rg + manual analysis

## Overview

Total exported types across packages: ~2297

## Top Duplicated Types

| Type                  | Occurrences | Packages                                           | Action                                                           |
| --------------------- | ----------- | -------------------------------------------------- | ---------------------------------------------------------------- |
| Currency              | 8           | domain (6 entities re-exporting) + application (2) | Low — domain already centralized, entities import from canonical |
| LedgerEntry           | 6           | shared (2) + application (4 services)              | HIGH — consolidate to one shared type                            |
| SunatCredentials      | 5           | infrastructure (5 sub-modules)                     | HIGH — consolidate to 1 type in infrastructure                   |
| RucInfo               | 5           | infrastructure (3) + application (2)               | HIGH — belong in domain                                          |
| ReportType            | 5           | application (3) + domain (2)                       | MEDIUM — consolidate to domain                                   |
| DocumentType          | 5           | domain (3) + application (2)                       | MEDIUM                                                           |
| AgentRole             | 5           | ai (3) + infrastructure (2)                        | HIGH — consolidate to ai package                                 |
| InvoiceItem           | 5           | domain (2) + application (2) + shared (1)          | MEDIUM — consolidate to domain                                   |
| OCROptions            | 5           | infrastructure (3) + ai (2)                        | HIGH                                                             |
| BankAccountType       | 4           | domain (2) + application (2)                       | MEDIUM                                                           |
| TrialBalanceReport    | 4           | application (3) + shared (1)                       | HIGH                                                             |
| BalanceSheetReport    | 4           | application (3) + shared (1)                       | HIGH                                                             |
| IncomeStatementReport | 4           | application (3) + shared (1)                       | HIGH                                                             |
| AccountBalance        | 4           | application (2) + domain (1) + shared (1)          | MEDIUM                                                           |

## Priority Candidates (by impact)

### 1. SunatCredentials (5x, infrastructure only)

All in packages/infrastructure/src/sunat/ — different sub-modules defining the same interface.
Fix: Extract to packages/infrastructure/src/sunat/types.ts, re-export.

### 2. LedgerEntry (6x, shared + application)

Defined in shared and 4 application services.
Fix: Keep in shared, remove from application services, re-import from shared.

### 3. RucInfo (5x, infrastructure + application)

Belongs in domain. Currently scattered.
Fix: Move to packages/domain/src/fiscal/types.ts, import from there.

### 4. Financial Reports types (TrialBalanceReport, BalanceSheetReport, IncomeStatementReport)

3-4 definitions each in application + shared.
Fix: Consolidate to shared, remove duplicates in application.

### 5. AgentRole/Banking types

Scattered across ai + infrastructure packages.
Fix: Each should live in the owning package and be imported by consumers.

## Next Steps

Each candidate should be:

1. Verify all definitions are functionally identical
2. Choose canonical location
3. Consolidate with barrel re-exports
4. Update all imports
5. Remove duplicate definitions
6. Verify `bun run typecheck` and `bun run test` pass
