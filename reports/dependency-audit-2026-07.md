# Dependency Audit Report — July 2026

**Generated:** 2026-07-09
**Tool:** npm-check-updates --deep

## Critical Updates (Major Breaking Changes)

| Package | Current | Latest | Type |
|---------|---------|--------|------|
| ai | ^6.0.208 | ^7.0.19 | MAJOR |
| @ai-sdk/google | ^3.0.83 | ^4.0.11 | MAJOR |
| @openrouter/ai-sdk-provider | ^2.1.1 | ^3.0.0 | MAJOR |
| @mastra/core | ^1.4.0 | ^1.50.1 | MAJOR |
| typescript | ~6.0.3 | ~7.0.2 | MAJOR |
| picomatch | 2.3.2 | 4.0.5 | MAJOR |
| minimatch | 9.0.7 | 10.2.5 | MAJOR |
| undici | 7.28.0 | 8.7.0 | MAJOR |
| @types/node | ^25.9.3 | ^26.1.1 | MAJOR |

## Minor Updates

| Package | Current | Latest |
|---------|---------|--------|
| @biomejs/biome | ^2.5.0 | ^2.5.3 |
| vite | ^8.0.16 | ^8.1.4 |
| turbo | ^2.9.18 | ^2.10.4 |
| better-auth | ^1.6.19 | ^1.6.23 |
| eslint | ^10.5.0 | ^10.6.0 |
| knip | ^6.24.0 | ^6.25.0 |
| bun | 1.3.11 | 1.3.14 |

## Circular Dependencies (madge)

Found 18 circular dependencies across the codebase.
Notable: agentic-ledger service, banking repository, journal-entry domain.

## Dead Code (knip)

Multiple unused exports detected, primarily in test files and
recently moved features. Details in knip command output.
