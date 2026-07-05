# AM4 — Sidebar Reduction & Navigation by Command

**Estado:** Proposal · **Creado:** 2026-07-05
**Depende de:** AM3

---

## Problema

El sidebar tiene 80+ rutas que el usuario navega manualmente. En el paradigma agéntico, la navegación principal es por comando (`⌘K`, `@referencias`, `/comandos`), no por menú.

## Propuesta

Reducir el sidebar de 80+ entradas a ~7 entradas máximo:

```
Drenyra
├── Buscar casos... (+ ⌘K para todo lo demás)
├── CASOS (lista dinámica de casos activos)
│
├── 📌 Ledger (libro diario/mayor — legal)
├── 📌 Compliance (semáforo SUNAT/SIRE)
├── 📌 Aprobaciones (bandeja cross-caso)
├── 📌 Clientes / Proveedores (dato maestro)
├── 📌 Evidencia (vault auditable)
│
├── Configuración
└── Control Tower (admin — oculto para contador final)
```

### Mecanismos de navegación restantes

1. **Sidebar reducido** — solo boards persistentes y lista de casos
2. **⌘K (Command Palette)** — buscador universal para cualquier ruta, tool o caso
3. **@referencias** — `@banco:BNB`, `@cliente:123`, `@ledger:enero` dentro del chat
4. **/comandos** — `/conciliar`, `/declarar`, `/cerrar-mes` invocan tools directamente

### PRs

| PR  | Contenido                                                        | Archivos | Líneas est. |
| --- | ---------------------------------------------------------------- | -------- | ----------- |
| PR1 | Reducir sidebar a 7 entradas + implementar buscador universal ⌘K | ~10      | ~400        |

## Riesgos

- **Alto**: Sacar 70+ rutas del sidebar va a confundir usuarios que las usan por costumbre. Necesita un período de transición o un "modo legacy" temporal.
- **Alto**: El buscador ⌘K debe ser rápido y completo — si el usuario escribe "factura" y no encuentra nada porque el índice no está actualizado, la confianza se rompe.
- **Medio**: Los boards legales (Ledger, Compliance) deben mantener toda su funcionalidad actual aunque pierdan 70 compañeros de sidebar.
