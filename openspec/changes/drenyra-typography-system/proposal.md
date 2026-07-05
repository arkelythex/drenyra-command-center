# DS2 — Typography & Font System

**Estado:** Proposal
**Creado:** 2026-07-05
**Depende de:** DS1

---

## Problema

El proyecto actualmente usa "Plus Jakarta Sans" para UI y "JetBrains Mono" para código, cargados desde CDN. El Design System nuevo requiere tres familias:

- **Geist Mono** — montos, RUC, códigos PCGE, comprobantes
- **Inter** — toda la interfaz, copy, navegación
- **Space Grotesk** — solo momentos de marca (onboarding, splash, títulos de reporte)

Además, cargar fonts desde CDN externo agrega handshakes DNS + TLS que perjudican LCP y CLS. El DS exige self-hosting.

## Propuesta

1. **Descargar y self-hostear** Geist Mono + Inter + Space Grotesk como WOFF2 variable fonts en `apps/web/public/fonts/`
2. **Subsetear a Latin** con `pyftsubset` (reducción ~93% de peso: Inter 300KB → ~20KB)
3. **Configurar `@font-face`** con `font-display: swap` y declaraciones `font-weight: 100 900`
4. **Precargar fuente crítica** (Geist Mono para tabla de asientos) via `<link rel="preload">`
5. **Migrar SettingsContext** — reemplazar "Plus Jakarta Sans" → "Inter", "JetBrains Mono" → "Geist Mono" en `DEFAULT_CODEX_THEME` y `CODEX_LIGHT_THEME`
6. **Configurar escala tipográfica** en CSS: `--text-xs` a `--text-2xl` con ratio major third (1.25)
7. **Cache headers** — `Cache-Control: public, max-age=31536000, immutable`

## No-alcance

- No se cambian layouts ni componentes existentes
- No se implementa `font-variant-numeric: tabular-nums` globalmente (se hace cuando se toque la tabla de asientos en DS5)

## PRs

| PR  | Contenido                                                     | Archivos | Líneas est. |
| --- | ------------------------------------------------------------- | -------- | ----------- |
| PR1 | Font files + @font-face + precarga + SettingsContext + escala | 5-8      | ~200        |

## Riesgos

- **Alto**: Geist Mono puede no estar disponible como descarga gratuita (es propiedad de Vercel). Alternativa: interpolar con "Geist Mono" como prioritario, fallback a "JetBrains Mono" o "SF Mono".
- **Medio**: El subset Latin puede no cubrir caracteres especiales que usen los comprobantes SUNAT (tildes, ñ, símbolos monetarios). Verificar antes de subsetear.
- **Bajo**: `font-display: swap` puede causarFOUT (flash of unstyled text). Aceptable para el perfil de uso (contador abriendo casos varias veces al día, la fuente se cachea rápido).
