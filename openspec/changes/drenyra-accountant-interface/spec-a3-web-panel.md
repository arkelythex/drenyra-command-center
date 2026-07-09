# Spec: A3 — Accountant Web Panel

> **Phase**: spec
> **Campaña**: A3 Web Panel
> **Depende de**: A1 Query Engine (API), A2 Approval Workflow (API + engine)
> **Frente**: apps/web (React 19 + TanStack Router)

---

## 1. UX / Wireframes

### 1.1 Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ [Drenyra]  ▸  Panel Contable                  contador@... │
├─────────────────────────────────────────────────────────────┤
│ 📊 Resumen Fiscal — Julio 2026          RUC 20123456789     │
│                                                             │
│  IGV Compra      IGV Venta        Detracciones  Pendientes  │
│  S/ 18,234.50    S/ 9,876.00     3 por S/ 1,200.00   2     │
│  ████████████    ██████▒▒▒▒       █▒▒▒▒▒▒▒▒▒▒        ⚠     │
│                                                             │
│ ┌─────────────────────────┐ ┌──────────────────────────┐   │
│ │ 🔍 Consulta Fiscal     │ │ ⏳ Pendientes             │   │
│ │                        │ │                           │   │
│ │ ¿Qué querés consultar? │ │ REC-001  IGV S/18,234.50 │   │
│ │ ┌───────────────────┐  │ │           [Ver] [Aprobar] │   │
│ │ │ IGV de julio 2026 │  │ │ REC-002  Detracc. S/450  │   │
│ │ └───────────────────┘  │ │           [Ver] [Aprobar] │   │
│ │ [Consultar]            │ │                           │   │
│ └─────────────────────────┘ └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Query Result

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 IGV de julio 2026                           [Nueva consulta] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📋 IGV estimado para julio 2026                             │
│   RUC: 20123456789                                          │
│                                                             │
│   IGV Compra:   S/ 18,234.50  ████████████░░░  Confianza    │
│   IGV Venta:    S/ 9,876.00   ██████▒▒▒▒▒▒▒▒░  0.92        │
│   IGV Neto:     S/ 8,358.50                                  │
│                                                             │
│ 📎 Evidencia (45 facturas compra, 12 venta)                  │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ F001-123  | IGV S/ 450.00 | CDR ✓ | 2026-07-05    │   │
│   │ F001-124  | IGV S/ 1,200.00| CDR ✓ | 2026-07-12   │   │
│   │ ... (top 5 mostrando)                               │   │
│   │ [Ver las 45 facturas →]                             │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│ 💡 ¿Querés contabilizar este IGV?                           │
│   [Crear recomendación]  → aprobación pendiente             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Approval Detail

```
┌─────────────────────────────────────────────────────────────┐
│ ⏳ REC-001: IGV julio 2026                     [Volver]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ⚠ Pendiente de aprobación                                   │
│   Creado: 2026-07-09 14:30                                  │
│   Tiempo restante: 23h 45m (timeout → escalación)          │
│                                                             │
│ 📋 Detalle de la Recomendación                              │
│   Acción: Contabilizar IGV por S/ 18,234.50                 │
│   Basado en: 45 facturas de compra + 12 de venta            │
│   Confianza: 0.92                                           │
│   Pipeline: igv-julio-2026                                  │
│                                                             │
│ 📎 Evidencia                                                │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ F001-123  | IGV S/ 450.00 | CDR ✓                  │   │
│   │ F001-124  | IGV S/ 1,200.00| CDR ✓                 │   │
│   │ Hash pipeline: 0xabc123...                          │   │
│   │ [Ver evidencia completa]                            │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌──────────────┐  ┌────────────────────────────────────┐   │
│ │ ✅ Aprobar   │  │ ❌ Rechazar  Motivo: ___________  │   │
│ └──────────────┘  └────────────────────────────────────┘   │
│                                                             │
│ 📜 Historial                                                │
│   2026-07-09 14:30 | Creada por pipeline igv-julio-2026    │
└─────────────────────────────────────────────────────────────┘
```

## 2. Contrato Técnico

### 2.1 Nuevas features

```
apps/web/src/
├── features/
│   ├── consulta/
│   │   ├── ConsultaPage.tsx         # /consulta — query input + results
│   │   ├── ConsultaInput.tsx        # Text input con ejemplos
│   │   ├── QueryResult.tsx          # Resultado de consulta
│   │   ├── EvidenceList.tsx         # Lista de evidencia expandible
│   │   └── CreateRecommendationButton.tsx  # "Crear recomendación"
│   ├── approval/
│   │   ├── ApprovalListPage.tsx     # /approval — listado de pendientes
│   │   ├── ApprovalDetailPage.tsx   # /approval/:id — detalle + aprobar/rechazar
│   │   ├── RecommendationCard.tsx   # Card de recomendación resumida
│   │   ├── ApproveButton.tsx        # Botón de aprobar
│   │   └── RejectForm.tsx           # Formulario de rechazo con motivo
│   └── evidence/
│       ├── EvidenceViewer.tsx       # Evidence expandible + CDR hash
│       ├── EvidenceSourceRow.tsx    # Una fila de fuente (factura, etc)
│       └── EvidenceTimeline.tsx     # Timeline de evidence artifacts
├── layouts/
│   └── AccountantLayout.tsx         # Layout con sidebar fiscal
├── routes/
│   ├── accountant.consulta.tsx      # Route definition
│   ├── accountant.approval.tsx      # Route definition
│   └── accountant.approval.$id.tsx  # Route definition
```

### 2.2 Routes

| Route                      | Component             | Description                           |
| -------------------------- | --------------------- | ------------------------------------- |
| `/accountant`              | `AccountantDashboard` | Resumen, query input, pendientes      |
| `/accountant/consulta`     | `ConsultaPage`        | Consulta fiscal dedicada              |
| `/accountant/approval`     | `ApprovalListPage`    | Lista de recomendaciones pendientes   |
| `/accountant/approval/:id` | `ApprovalDetailPage`  | Detalle + aprobar/rechazar            |
| `/accountant/evidence/:id` | `EvidenceViewer`      | Ver evidence artifacts de un pipeline |

### 2.3 Shared types (packages/shared)

```typescript
// packages/shared/src/consulta/types.ts
interface ConsultaResponse {
  tipo: IntentKind
  ruc: string
  periodo: string
  resultado: Record<string, unknown>
  confianza: number
  fuentes: EvidenceSource[]
  puedeRecomendar: boolean // true if confidence > threshold
}
```

### 2.4 API Endpoints (new or existing)

| Endpoint                    | Method | Purpose                          |
| --------------------------- | ------ | -------------------------------- |
| `/api/consulta`             | POST   | Query natural language           |
| `/api/approval/pending`     | GET    | List pending recommendations     |
| `/api/approval/:id`         | GET    | Recommendation detail            |
| `/api/approval/:id/approve` | POST   | Approve recommendation           |
| `/api/approval/:id/reject`  | POST   | Reject with reason               |
| `/api/accountant/summary`   | GET    | Dashboard summary for RUC/period |

## 3. Criterios de Aceptación

| Criterio | Verificación                                                   |
| -------- | -------------------------------------------------------------- |
| CA1      | Dashboard muestra resumen fiscal del período con cards         |
| CA2      | Input de consulta acepta lenguaje natural y muestra resultados |
| CA3      | Evidence expandible con CDR hash, fuente, confianza            |
| CA4      | Botón "Crear recomendación" genera recomendación               |
| CA5      | Pending list muestra recomendaciones con aprobar/rechazar      |
| CA6      | Approval detail muestra evidencia completa + historial         |
| CA7      | Aprobar/rechazar desde web llama a API y actualiza UI          |
| CA8      | Layout tiene sidebar con navegación fiscal                     |
| CA9      | Responsive (tablet + desktop)                                  |

## 4. Pruebas

```bash
cd apps/web && npx vitest run

# E2E (Playwright)
cd apps/web && npx playwright test tests/accountant/
```

## 5. No-Alcance (para A3)

- Gráficos y visualizaciones complejas (solo cards)
- Notificaciones en tiempo real (solo polling)
- Mobile-first (responsive pero no mobile-optimized)
- Múltiples RUCs simultáneos en dashboard
