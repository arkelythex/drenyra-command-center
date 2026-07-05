# DS1-SPEC-01: Color Palette Specification

**Basado en:** DESIGN.md (Julio 2026) · **Version:** 1.0

---

## 1. Paleta Dark Mode

| Token                 | Valor HEX | Uso                                    |
| --------------------- | --------- | -------------------------------------- |
| `canvas-dark`         | `#0B0E11` | Fondo raíz, más profundo que gris puro |
| `surface-dark`        | `#12161B` | Paneles, tarjetas                      |
| `surface-2-dark`      | `#1A1F26` | Paneles elevados, hover                |
| `overlay-dark`        | `#20262E` | Modales, popovers                      |
| `border-subtle-dark`  | `#262C34` | Bordes sutiles                         |
| `border-default-dark` | `#323A44` | Bordes por defecto                     |
| `text-primary-dark`   | `#EDEFF2` | Texto principal (NO #FFF — APCA)       |
| `text-secondary-dark` | `#A8B0BC` | Texto secundario                       |
| `text-tertiary-dark`  | `#6B7480` | Texto terciario                        |
| `text-disabled-dark`  | `#454C56` | Texto deshabilitado                    |

## 2. Paleta Light Mode

| Token                  | Valor HEX | Uso                              |
| ---------------------- | --------- | -------------------------------- |
| `canvas-light`         | `#FAFAF9` | Fondo raíz                       |
| `surface-light`        | `#FFFFFF` | Paneles, tarjetas                |
| `surface-2-light`      | `#F2F2F0` | Paneles elevados                 |
| `overlay-light`        | `#FFFFFF` | Modales                          |
| `border-subtle-light`  | `#E5E5E2` | Bordes sutiles                   |
| `border-default-light` | `#D4D4D0` | Bordes por defecto               |
| `text-primary-light`   | `#16181B` | Texto principal (NO #000 — APCA) |
| `text-secondary-light` | `#52565D` | Texto secundario                 |
| `text-tertiary-light`  | `#7A7F87` | Texto terciario                  |
| `text-disabled-light`  | `#B0B4BA` | Texto deshabilitado              |

## 3. Acentos de Marca

| Token               | Dark      | Light     | Uso                              |
| ------------------- | --------- | --------- | -------------------------------- |
| `accent-cyan`       | `#3CE6D8` | `#0A8A7D` | Acento primario                  |
| `accent-cyan-dim`   | `#1F8A80` | `#0D6E64` | Texto pequeño sobre fondo oscuro |
| `accent-violet`     | `#9B7FE8` | `#5B3FA8` | Acento secundario                |
| `accent-violet-dim` | `#6B54A8` | `#472F86` | Violeta suave                    |

## 4. Estados Fiscales (nunca solo color — siempre + ícono + texto)

| Token           | Dark      | Light     | Uso                                     |
| --------------- | --------- | --------- | --------------------------------------- |
| `state-success` | `#4ADE94` | `#1A8F52` | Asiento validado / declaración aceptada |
| `state-warning` | `#F5B84A` | `#A86A0A` | Requiere revisión del contador          |
| `state-error`   | `#F0665E` | `#C23B33` | Rechazo SUNAT / inconsistencia fiscal   |
| `state-pending` | `#6B9FE8` | `#2E5FB8` | En proceso / esperando aprobación       |

## 5. Token Mapping: Old → New

| Old token (espresso/voltage)      | New token (cyan/violet)       |
| --------------------------------- | ----------------------------- |
| `espresso-0` (#161614)            | canvas-dark (#0B0E11)         |
| `espresso-1` (#1c1c1a)            | surface-dark (#12161B)        |
| `espresso-2` (#242422)            | surface-2-dark (#1A1F26)      |
| `espresso-3` (#2e2e2b)            | overlay-dark (#20262E)        |
| `cream-0` (#f7f7f4)               | canvas-light (#FAFAF9)        |
| `cream-1` (#efeee8)               | surface-light (#FFFFFF)       |
| `voltage-500` (#f54e00)           | accent-cyan (#3CE6D8)         |
| `voltage-400` (#ff6a1a)           | accent-cyan-dim (#1F8A80)     |
| `white` (#e8e6e0)                 | text-primary-dark (#EDEFF2)   |
| `gray-400` (#9a9890)              | text-secondary-dark (#A8B0BC) |
| `fiscal-500` (#c45c2a)            | accent-violet (#9B7FE8)       |
| `green-500` (oklch 0.65 0.22 150) | state-success (#4ADE94)       |
| `amber-500` (oklch 0.75 0.22 80)  | state-warning (#F5B84A)       |
| `red-500` (oklch 0.55 0.25 25)    | state-error (#F0665E)         |

## 6. Archivos a modificar

1. `apps/web/src/lib/design-tokens/tokens.dtcg.json` — Reemplazar valores de color
2. `apps/web/src/lib/design-tokens/generated/tokens.css` — Regenerar manual (el generator es stub)
3. `apps/web/src/lib/design-tokens/generated/tokens.ts` — Actualizar PALETTE
4. `apps/web/src/index.css` — Remover overrides manuales que duplican tokens; mantener los funcionales
5. `apps/web/src/context/SettingsContext.tsx` — Actualizar `DEFAULT_CODEX_THEME`, `CODEX_LIGHT_THEME`, `applyCodexThemeTokens()`
