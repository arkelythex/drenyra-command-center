# Design — Drenyra Philosophy Docs Alignment

## Documentation architecture

Use one canonical source and short references elsewhere.

```text
Canonical source
└── docs/products/drenyra-product-philosophy.md
    ├── North star
    ├── Web app philosophy
    ├── CLI philosophy
    ├── Agentic accounting guardrails
    ├── Fiscal safety rules
    ├── Human control rules
    ├── Non-goals
    └── Review checklist

Reference points
├── AGENTS.md
├── CODEX-MAP.md
├── apps/web/MAP.md
├── apps/cli/MAP.md
├── openspec/config.yaml
└── openspec/master-index.md
```

## Why not duplicate content

Duplicating the full philosophy across root and app docs creates drift. Root and app files should answer: "why this matters here" and link to the canonical source for detail.

## Update strategy

| File                                          | Change style                                                |
| --------------------------------------------- | ----------------------------------------------------------- |
| `docs/products/drenyra-product-philosophy.md` | New canonical document.                                     |
| `AGENTS.md`                                   | Add concise guardrails and link.                            |
| `CODEX-MAP.md`                                | Add discoverability link near Start here.                   |
| `apps/web/MAP.md`                             | Add surface philosophy near Start here.                     |
| `apps/cli/MAP.md`                             | Refine existing Gentleman mention into terminal philosophy. |
| `openspec/config.yaml`                        | Register plans.                                             |
| `openspec/master-index.md`                    | Add Philosophy track and execution order.                   |

## Review path

1. Start with canonical philosophy doc.
2. Review root and app references only for consistency.
3. Review OpenSpec registry updates last.
4. Confirm no implementation behavior changed.

## Validation

- Markdown formatting should be clean.
- Internal links should resolve.
- Docs should preserve Spanish/English conventions already used in the target files.
- If docs verification fails due to pre-existing issues, record the evidence and scope it.
