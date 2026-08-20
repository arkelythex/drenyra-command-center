# Drenyra Command Center — Brand & Banner

> **Normative source:** the Drenyra ecosystem brand contract —
> [`drenyra-ai/contracts/brand-system.md`](https://github.com/arkelythex/drenyra-ai/blob/main/contracts/brand-system.md)
> (v0.2 DRAFT) and canonical tokens at `contracts/brand-system/tokens.json`.
>
> The ecosystem design system is **the Dreamcoder Workbench canonical tokens**:
> Cocoa/Lúcuma Light (warm ivory `#F3EADC`, dark ink `#17120D`) editorial
> surface and Anthracite Steel dark, with cocoa `#824F16` / terracotta
> `#A7471C` accents — readability before decoration. No product invents its
> own palette.

## Regeneration prompt (ChatGPT Images 2.0)

> **Art direction (v2, Dreamcoder Light + Black Dark OLED):** see
> [gpt-image-prompts.md](https://github.com/arkelythex/drenyra-ai/blob/main/docs/assets/brand/gpt-image-prompts.md).
> Combine the Shared DNA block (section 4) with the product section below; the
> embedded prompt is the product section only and may trail the canonical file.

The canonical set lives in
[`drenyra-ai/docs/assets/brand/gpt-image-prompts.md`](https://github.com/arkelythex/drenyra-ai/blob/main/docs/assets/brand/gpt-image-prompts.md).
The Command Center prompt is the **institutional control artifact** motif:

```text
Subject: an accounting command center rendered as a premium institutional control artifact, not as a software dashboard. The hero on the right third is a circular command dais made of layered smoked glass and matte anthracite ceramic, with three raised translucent slabs emerging from it like disciplined strata rather than floating interface cards. Inside the slabs, only minimal abstract signals are visible: elegant ledger pulses, a restrained approval rhythm, and a verification cadence — never a literal app screen.

Around the core, two tilted orbital rings wrap the object: one cyan for validation, one violet for intelligence. At the center sits a dual-approval seal formed by two interlocking arcs, with a subtle success-green verification mark engraved into the inner surface, catching rim light like a machined emblem. Tiny spark points appear only where orbital paths intersect, suggesting moments of verified truth.

The object must feel calm, exact, and elite — like the operating altar of a fiscal intelligence system. No generic charts, no obvious business intelligence dashboard, no startup analytics vibe. Signature detail: the engraved approval seal and the precision edge-lighting on the layered slabs.
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
