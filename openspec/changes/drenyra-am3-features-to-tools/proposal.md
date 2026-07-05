# AM3 — Features → Tools/Artifacts

**Estado:** Proposal · **Creado:** 2026-07-05
**Depende de:** AM1, AM2

---

## Problema

Features como `banking`, `bills`, `cashflow`, `taxation`, `payroll`, `invoices`, `inventory` tienen rutas de primer nivel en el sidebar. En el paradigma agéntico, deberían ser **tools que el agente invoca** y **artifacts que se renderizan inline** en el thread.

## Propuesta

1. **Template: Banking como primera migración**
   - `conciliar_banco()` como skill expuesta al agente
   - El resultado (tabla de conciliación con pares banco/ledger) se renderiza como artifact inline en el thread
   - Documentar el patrón para replicar en las demás features
   - Eliminar la ruta `/tesoreria/banking` (o redirigir)

2. **Features a migrar (en orden)**

| Feature                        | Tool                  | Artifact                   | Ruta actual                     | Destino                     |
| ------------------------------ | --------------------- | -------------------------- | ------------------------------- | --------------------------- |
| `banking`                      | `conciliar_banco()`   | Tabla de conciliación      | `/tesoreria/banking`            | Eliminar ruta               |
| `bills`                        | `consultar_cxp()`     | Tabla de cuentas por pagar | `/tesoreria/bills`              | Eliminar ruta               |
| `cashflow`                     | `proyectar_flujo()`   | Gráfico inline             | `/tesoreria/cashflow`           | Reducir a widget            |
| `taxation`                     | `calcular_tributos()` | Resumen de impuestos       | `/cumplimiento/taxation`        | Eliminar ruta               |
| `payroll`                      | `generar_planilla()`  | Tabla inline               | `/payroll`                      | Eliminar ruta               |
| `credit-notes` / `debit-notes` | `emitir_nota()`       | Documento inline           | `/credit-notes`, `/debit-notes` | Fusionar en invoices        |
| `inventory`                    | `consultar_kardex()`  | Tabla Kardex               | `/inventory`                    | Mantener board legal + tool |

### PRs

| PR  | Contenido                                              | Archivos | Líneas est. |
| --- | ------------------------------------------------------ | -------- | ----------- |
| PR1 | Banking como template: tool + artifact + eliminar ruta | ~10      | ~400        |
| PR2 | Bills + Cashflow                                       | ~8       | ~250        |
| PR3 | Taxation + Payroll                                     | ~8       | ~250        |
| PR4 | Credit/Debit notes → invoices                          | ~6       | ~150        |
| PR5 | Inventory: board + tool dual                           | ~5       | ~150        |

## Riesgos

- **Alto**: Convertir banking en skill requiere que el agente tenga acceso a la API de banking. Puede necesitar refactor de backend para exponer las operaciones como funciones invocables.
- **Alto**: Cashflow como artifact inline pierde el dashboard con gráficos interactivos — necesita un diseño de artifact que no sea una tabla plana.
- **Medio**: Al eliminar rutas, los links externos y bookmarks dejan de funcionar. Implementar redirects con período de gracia.
