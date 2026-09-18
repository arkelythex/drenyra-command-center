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

The canonical set lives in
[`drenyra-ai/docs/assets/brand/gpt-image-prompts.md`](https://github.com/arkelythex/drenyra-ai/blob/main/docs/assets/brand/gpt-image-prompts.md).
The Command Center prompt is the **orbital console with dual-approval seal**:

```text
Drenyra ecosystem brand banner in the Dreamcoder-inspired visual language:
calm, premium, architectural. Background: deep anthracite-navy canvas #0B0E11
with a faint blueprint grid at ~3% white opacity and a subtle 1% film grain to
smooth gradients. Two aurora glows at low intensity (5-8% opacity): cyan
#3CE6D8 on the upper right, violet #9B7FE8 on the lower left, both diffused
into the canvas with no hard edges. Accent colors allowed ONLY: cyan #3CE6D8
(lighter #6AEFE4, dimmer #1F8A80), violet #9B7FE8 (lighter #B8A2F0, dimmer
#7B66C0), success green #4ADE94, muted blue-gray #A8B0BC, plus the surface
ladder #12161B, #1A1F26, #20262E for layered panels and elevation shadows.
All gradients blend exclusively between these colors. Composition language:
layered elevation with soft inner shadows, curved geometry (orbital arcs,
concentric rings, sweeping Bézier curves), and tiny luminous spark accents at
arc intersections. Subject: an abstract accounting command center. Focal point
on the right third: three stacked translucent console panels (surfaces
#12161B, #1A1F26, #20262E) with rising ledger bars in cyan #3CE6D8, success
green #4ADE94 and muted blue-gray #A8B0BC. Wrapped around the console: two
concentric orbital rings — one cyan #3CE6D8, one violet #9B7FE8 — tilted in
3D, with small spark dots at the points where a sweeping Bézier curve crosses
each ring. At the console center: a dual-approval seal (two interlocking arcs,
cyan and violet) with a checkmark in success green #4ADE94, surrounded by a
soft focus halo. NO cartoon, NO mascot, NO photorealism, NO organic texture.
NO TEXT of any kind — no letters, words, numbers, or logos; the product name
lives in the README, never in the raster. Aspect ratio exactly 1400:460
(banner). Keep C2PA provenance metadata and the imperceptible watermark
enabled.
```

Light variant (optional): swap canvas to `#FAFAF9`, panels to `#FFFFFF` /
`#F2F2F0`, rings to cyan `#2ECFC2` and violet `#6B54A8`, checkmark to
`#1A8F52`, sparks to `#1F8A80`.

## Validate

```bash
node /home/dreamcoder08/Documents/PROYECTOS/drenyra-ai/scripts/brand-conformance.mjs \
  assets/branding/drenyra-banner.png
# expect: ✓ <file> (coverage >= 0.92) ... PASS
```

Iterate with the checker's off-palette feedback until coverage ≥ 0.92. Then
`bun run brand:ecosystem` in drenyra-ai must report this repo `PASS` before
brand-system can freeze to v0.3.
