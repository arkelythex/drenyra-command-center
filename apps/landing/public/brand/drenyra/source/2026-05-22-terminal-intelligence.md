# Drenyra Terminal Intelligence — image generation (Codex)

## Visual direction (fusion)

- **Codex**: deep black, subtle gradients, large type, AI power — teal/cyan electric accent.
- **Digits**: professional cards, white space, trust for fiscal software.
- **Reference**: warm beige/sepia + black, macOS window + terminal agent, engineering fiscal tool.

## Palette

| Token | Hex / note |
| --- | --- |
| Base | `#000000` → `#141414` |
| Accent (lucuma gray) | `#a3a3a3` / `var(--drenyra-accent)` (cursor, badges, active) |
| Warm | `#d4c4a8` sepia, `#9a8f7a` warm gray |
| Success | `#34d399` (IGV ok, validations) |
| Alert | `#f87171` subtle |

## Constraints

- No readable UI text in images (app renders copy).
- No third-party marks or fake brand names.
- Dark overlay-safe zones for captions if needed.
- Export **WebP** quality ~82.

## Assets (install under `public/brand/drenyra/`)

| Slot ID | File | Size |
| --- | --- | --- |
| hero-agent | `hero-agent.webp` | 1920×1080 |
| workflow | `workflow.webp` | 1200×900 |
| feature-sire | `feature-sire.webp` | 800×600 |
| feature-igv | `feature-igv.webp` | 800×600 |
| feature-detracciones | `feature-detracciones.webp` | 800×600 |
| feature-domain | `feature-domain.webp` | 800×600 |
| trust | `trust.webp` | 1600×600 |

## App integration

- Slots: `components/drenyra/drenyra-media-slot.tsx`
- Registry: `lib/landing/drenyra-media.ts`
- Workflow panel: `components/drenyra/drenyra-workflow-panel.tsx` — renders `workflow` slot with `showCodexBrief` until WebP exists.
- Until files exist, placeholders show slot ID, dimensions, and `codexBrief` for Codex handoff.
