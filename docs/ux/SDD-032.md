# SDD-032 — Typography, Numerals and Localization

**Estado:** PROPOSED  
**Depende de:** SDD-002, SDD-030  
**Informa:** tablas, forms, exports y LATAM expansion

## Decisión

La tipografía priorizará lectura densa y comparación numérica. Montos, porcentajes, correlativos y periodos usarán numerales tabulares. El locale por defecto será `es-PE`, timezone `America/Lima` y moneda por artefacto, nunca implícita por ubicación del usuario.

## Escala

- Display solo para páginas de orientación.
- Heading para estructura, no decoración.
- Body para explicación.
- Compact body para tablas.
- Label para controles.
- Mono/tabular para IDs, códigos y números comparables.

## Reglas de formato

- Persistencia usa valores y fechas normalizados; UI localiza.
- Monto siempre conserva currency y scale.
- Ceros, null, no aplicable, pendiente y error se representan distinto.
- Negativos usan signo consistente; paréntesis solo en contexto configurado.
- Fechas ambiguas incluyen formato explícito; periodos usan `YYYY-MM` internamente.
- RUC, series y correlativos no se convierten a número perdiendo ceros.

## Copy

Verbos canónicos provienen de SDD-002. Mensajes de error indican condición, impacto y acción. La IA no utiliza certeza absoluta cuando solo genera recomendación.

## Criterios de aceptación

- Comparaciones numéricas alinean dígitos y decimales.
- Tests cubren moneda, redondeo, fechas límite y timezone.
- Export y UI no cambian el valor económico.
- Text zoom 200% no rompe acciones críticas.
- Arquitectura admite nuevos locales sin fork de componentes.
