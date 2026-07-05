# DS5 — Three-Panel Layout (Agentic IDE)

**Estado:** Proposal
**Creado:** 2026-07-05
**Depende de:** DS1 (tokens), DS2 (tipografía)

---

## Problema

Actualmente la ruta `/drenyra/case-1` no tiene un layout formalizado. El DS exige un entorno de tres paneles inspirado en Cursor 3 / Codex app, pero con nomenclatura y función 100% contable:

```
┌─────────────┬──────────────────────────────────┬─────────────────┐
│  Explorador  │   Editor central de asientos     │  Terminal del   │
│  de          │   (equivalente al diff view)      │  agente         │
│  comprobantes│                                    │  (persistente)  │
│              │  ┌──────────────────────────────┐ │                 │
│  · Enero'26  │  │ Debe          Haber           │ │  "Encontré 3    │
│  · Febrero   │  │ 60.1 Compras  40.1 IGV        │ │  comprobantes   │
│  · Detr.     │  │ [Aceptar] [Rechazar] [Editar] │ │  sin detracción │
│              │  └──────────────────────────────┘ │  aplicada..."   │
└─────────────┴──────────────────────────────────┴─────────────────┘
```

Además, hay conflicto entre `/drenyra` (vista panorama) y `/drenyra/case-1` (vista trabajo) que el DS resuelve con un sistema de navegación compartido.

## Propuesta

1. **Crear `DrenyraCaseLayout`** — el esqueleto de tres paneles:
   - Panel izquierdo: explorador de comprobantes/periodos (equivalente al file tree, con iconografía fiscal)
   - Panel central: editor de asientos propuestos (mono para montos, ui para descripciones, border-left de color para "propuesto agente" vs "confirmado contador")
   - Panel derecho: terminal/chat del agente persistente entre casos (estados: ejecutando / esperando aprobación / listo para revisar)
2. **Resolver navegación** entre `/drenyra` y `/drenyra/case-1`:
   - Mismo header global (logo, selector RUC, tema)
   - Breadcrumb consistente
   - Transición fluida
3. **Integrar con ruteo existente** — la ruta `/drenyra/case-1` debe cargar el nuevo layout

## No-alcance

- No se implementa la lógica de negocio del editor de asientos (solo layout)
- No se conecta con APIs reales (solo mock/placeholder data)
- No se migran componentes existentes al nuevo layout

## PRs

| PR  | Contenido                                                 | Archivos | Líneas est. |
| --- | --------------------------------------------------------- | -------- | ----------- |
| PR1 | DrenyraCaseLayout esqueleto + tres paneles + navegación   | 5-6      | ~300        |
| PR2 | Integración con ruteo + placeholders + ajustes responsive | 3-4      | ~200        |

## Riesgos

- **Alto**: El layout de tres paneles puede entrar en conflicto con el MainLayout existente. Requiere decidir si reemplazar o anidar.
- **Medio**: El panel derecho persistente entre casos requiere estado global (context o store) — puede necesitar refactor de cómo se maneja el agente actual.
- **Bajo**: Responsive en mobile — los tres paneles pueden colapsar a una vista de tabs.
