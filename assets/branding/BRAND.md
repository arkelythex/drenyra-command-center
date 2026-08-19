# Drenyra Command Center — Brand & Banner

> **Normative source:** the Drenyra ecosystem brand contract —
> [`drenyra-ai/contracts/brand-system.md`](https://github.com/arkelythex/drenyra-ai/blob/main/contracts/brand-system.md)
> (v0.2 DRAFT) and canonical tokens at `contracts/brand-system/tokens.json`.
>
> The ecosystem design system is **the same system as Drenyra apps/web**: dark
> + light themes and the cyan/violet accent system (DTCG token pipeline), with
> the Dreamcoder-inspired compositional language (elevation, aurora glows,
> curved geometry, spark accents). The Command Center must **not** invent its
> own palette — in either theme.

## Regeneration prompt (ChatGPT Images 2.0)

> **Art direction (2026-08-11):** the Shared DNA block was upgraded to the premium minimal-maximal direction — see [creative-brief.md](https://github.com/arkelythex/drenyra-ai/blob/main/docs/assets/brand/creative-brief.md). Combine the product section below with the **current** Shared DNA from [gpt-image-prompts.md](https://github.com/arkelythex/drenyra-ai/blob/main/docs/assets/brand/gpt-image-prompts.md); the embedded prompt is the product section only and may trail the canonical file.

The canonical set lives in
[`drenyra-ai/docs/assets/brand/gpt-image-prompts.md`](https://github.com/arkelythex/drenyra-ai/blob/main/docs/assets/brand/gpt-image-prompts.md).
The Command Center prompt is the **accounting command console** motif:

```text
Subject: an abstract accounting command center. Focal point on the right
third: three stacked translucent console panels (surfaces #12161B, #1A1F26,
#20262E) with rising ledger bars in cyan #3CE6D8, success green #4ADE94 and
muted blue-gray #A8B0BC. Wrapped around the console: two concentric orbital
rings — one cyan #3CE6D8, one violet #9B7FE8 — tilted in 3D, with small
spark dots at the points where a sweeping Bézier curve crosses each ring. At
the console center: a dual-approval seal (two interlocking arcs, cyan and
violet) with a checkmark in success green #4ADE94, surrounded by a soft focus
halo. Signature detail: the seal's engraving catches a rim light. Light
variant (optional): canvas #FAFAF9, panels #FFFFFF/#F2F2F0, rings cyan
#2ECFC2 and violet #6B54A8, checkmark #1A8F52, sparks #1F8A80.
```

## Validate

```bash
node ../drenyra-ai/scripts/brand-conformance.mjs \
  assets/branding/drenyra-banner.png
# expect: ✓ <file> (coverage >= 0.92) ... PASS
```

The checker is referenced from the sibling-checkout layout: clone `drenyra-ai`
next to this repository so `../drenyra-ai/scripts/brand-conformance.mjs`
resolves (the same `../<repo>` layout `drenyra-ai/scripts/brand-ecosystem-status.mjs`
assumes) — no host-specific absolute path.

Iterate with the checker's off-palette feedback until coverage ≥ 0.92. Then
`bun run brand:ecosystem` in drenyra-ai must report this repo `PASS` before
brand-system can freeze to v0.3.

## Freeze gate

`brand-system` freezes to v0.3 only when every consuming repo (App Web, Pi,
Engram, Skills, Guardian Angel) passes the same checker on its brand assets in
both themes.
