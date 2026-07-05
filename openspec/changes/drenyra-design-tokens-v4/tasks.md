# Tasks — DS1: Design Token Foundation

**Última actualización:** 2026-07-05

## Review Workload Forecast

| Metric                       | Value                                              |
| ---------------------------- | -------------------------------------------------- |
| 400-line budget risk         | **PR1 under (~250 lines), PR2 under (~150 lines)** |
| Chained PRs recommended      | **Yes — 2 PRs**                                    |
| Decision needed before apply | None                                               |

## PR1 — tokens.dtcg.json + generated/tokens.css

- [ ] 1.1 **Update tokens.dtcg.json** — dark palette: canvas (#0B0E11), surface (#12161B), surface-2 (#1A1F26), overlay (#20262E), borders (#262C34, #323A44), text (#EDEFF2, #A8B0BC, #6B7480, #454C56)
- [ ] 1.2 **Update tokens.dtcg.json** — light palette: canvas (#FAFAF9), surface (#FFFFFF), surface-2 (#F2F2F0), overlay (#FFFFFF), borders (#E5E5E2, #D4D4D0), text (#16181B, #52565D, #7A7F87, #B0B4BA)
- [ ] 1.3 **Update tokens.dtcg.json** — brand accents: cyan base (#3CE6D8), cyan dim (#1F8A80), violet base (#9B7FE8), violet dim (#6B54A8)
- [ ] 1.4 **Update tokens.dtcg.json** — fiscal states: success (#4ADE94), warning (#F5B84A), error (#F0665E), pending (#6B9FE8)
- [ ] 1.5 **Update tokens.dtcg.json** — semantic tier: rename voltage → cyan, add violet, re-map ai/halo
- [ ] 1.6 **Update tokens.dtcg.json** — component tier: button, chip, editorial — re-map to new palette
- [ ] 1.7 **Sync generated/tokens.css** — replace all @theme values with new palette
- [ ] 1.8 **Sync generated/tokens.ts** — update PALETTE export (cyan base #3CE6D8, state colors)

### PR1 gates

```bash
bun run typecheck
bun run lint
bun run test:run -- apps/web/src/lib/design-tokens
```

## PR2 — index.css cleanup + SettingsContext

- [ ] 2.1 **Audit** usages of old tokens: `rg "voltage\|espresso\|onyx\|cream\|akx-\|premium-" apps/web/src/ -g '*.tsx' -g '*.ts' -g '*.css'` and list replacements
- [ ] 2.2 **Clean index.css** — remove `.dark` variable overrides now covered by generated/tokens.css
- [ ] 2.3 **Clean index.css** — update remaining hardcoded voltage values to var(--color-*) references
- [ ] 2.4 **Update SettingsContext** `DEFAULT_CODEX_THEME` — new dark palette values
- [ ] 2.5 **Update SettingsContext** `CODEX_LIGHT_THEME` — new light palette values
- [ ] 2.6 **Update SettingsContext** `applyCodexThemeTokens()` — add any new CSS vars needed

### PR2 gates

```bash
bun run typecheck
bun run lint
bun run test:run
```

## Full delivery gates (post PR2)

```bash
bun run typecheck
bun run lint
bun run build
bun run test:run
bun run check:bundle
```

## Post-apply verification

- [ ] Visual: open `/configuracion/appearance` — theme toggle should show new colors
- [ ] Visual: dark mode — verify canvas is #0B0E11, not #161614
- [ ] Visual: light mode — verify primary text is #16181B, not #000
- [ ] Visual: accent buttons show cyan, not orange
