# S4: Domain Package Boundary Audit

**Fecha:** 2026-07-04
**Autor:** el Gentleman

---

## Problema

`packages/domain/` debe ser **framework-free** y contener solo entidades, value objects, y reglas de negocio puras del dominio fiscal. Sin embargo, actualmente contiene subdirectorios que pueden violar este principio:

```
packages/domain/src/
├── ai/              ← ¿Tipos de AI? El dominio fiscal no debería saber de AI
├── agents/          ← ¿Tipos de agentes? Similar — dominio fiscal != dominio de agentes
├── fiscal-agentic-ledger/  ← ¿Ledger agentico en domain?
├── fiscal-memory/   ← ¿Memoria fiscal en domain?
├── fiscal-ontology/ ← ¿Ontología fiscal en domain?
├── platform/        ← ¿Tipos de platform en domain?
├── services/        ← ¿Servicios en domain? Domain debe tener cero servicios
├── roi/             ← ¿ROI analysis en domain?
└── types/           ← ¿Product-surfaces types? Esto era de packages/core
```

Cada uno de estos debe evaluarse:

### 1. `domain/src/ai/` y `domain/src/agents/`

**Pregunta**: ¿Son tipos puramente fiscales o son tipos genéricos de AI/Agent que contaminan el dominio?

- Si contienen interfaces que los agentes usan para hablar con el dominio fiscal → **PUEDEN** estar en domain (son contratos de dominio)
- Si contienen implementaciones o tipos genéricos de AI → NO deben estar en domain

### 2. `domain/src/services/`

Clean Architecture dice: **domain NO tiene servicios**. Los servicios pertenecen a `application`. Si esto contiene lógica de negocio pura (domain services = stateless pure functions), está bien. Si tiene dependencias externas, está mal.

### 3. `domain/src/types/` (product-surfaces)

Migrado desde `packages/core`. Verificar si estos tipos son realmente de dominio o si deberían estar en `application` o `shared`.

### 4. `domain/src/fiscal-memory/`, `domain/src/fiscal-ontology/`, `domain/src/fiscal-agentic-ledger/`

Evaluar si son:

- **Tipos de dominio** (interfaces, contracts) → OK en domain
- **Implementaciones o lógica** → Deben estar en infrastructure o application

### 5. `domain/src/roi/` y `domain/src/platform/`

Evaluar si pertenecen al dominio fiscal o son concerns transversales que deberían estar en `shared`.

## Solución Propuesta

**No es un rewrite masivo** — es una auditoría con acciones quirúrgicas:

1. **Auditar cada subdirectorio sospechoso** contra el principio de dominio puro
2. **Mover solo lo que claramente no pertenece** (implementaciones, tipos genéricos de AI, lógica de aplicación)
3. **Dejar contratos de dominio** (interfaces que el dominio EXPONE a otros layers)

### Criterio de decisión

| ¿Esto en domain?                                                                       | Sí si... | No si... |
| -------------------------------------------------------------------------------------- | -------- | -------- |
| Es una interfaz/type que el dominio fiscal necesita para expresar una regla de negocio | ✅       | ❌       |
| Es una implementación concreta                                                         | ❌       | ✅       |
| Es un tipo genérico de AI/Agent (no fiscal-specific)                                   | ❌       | ✅       |
| Es un contrato entre agentes y el dominio fiscal                                       | ✅       | ❌       |
| Tiene dependencias de infraestructura (DB, API, file system)                           | ❌       | ✅       |
| Es pura lógica de negocio sin efectos secundarios                                      | ✅       | ❌       |

## Entregables

### PR 1: Audit Report & Quick Moves (estimado: ~200 líneas)

- Documentar cada subdirectorio sospechoso con evidencia de contenido
- Mover items claramente fuera de lugar
- Dejar interfaces de contrato de dominio intactas

### PR 2: Boundary Enforcement (estimado: ~150 líneas)

- Agregar reglas de arquitectura al CI (`bun run architecture:check-boundaries`)
- Agregar tests que verifiquen que domain no importa de paquetes externos
- Documentar los boundaries en `packages/domain/README.md`
