# Libro Diario - Guía de Diseño UI/UX para Contadores

> Documento basado en crítica profesional de UI/UX y contabilidad tributaria peruana.

---

## 1. Diseño Visual (UI)

### 1.1 Contraste y Fatiga Visual

**Problema**: Fondo muy oscuro con textos secundarios (códigos de cuenta `1041`, `1212`) en gris sobre negro = contraste bajo.

**Impacto**: Contadores que pasan 8+ horas necesitan escanear rápidamente sin fatiga.

**Solución**:
```css
/* ❌ Antes */
.account-code { @apply text-gray-500; }

/* ✅ Después */
.account-code { @apply text-gray-300; }  /* O text-slate-200 */
```

**Colores Semánticos Recomendados**:
| Elemento | Color Actual | Color Recomendado |
|----------|-------------|-------------------|
| Código de cuenta | `gray-500` | `gray-300` |
| Texto secundario | `white/40` | `white/60` |
| Montos positivos | `accent-celeste` | ✅ Mantener |
| Montos negativos | `red-400` | ✅ Mantener |

---

### 1.2 Densidad de Información (Tabla)

**Problema**: Espaciado vertical excesivo en filas expandidas. Un asiento con 50 líneas = mucho scroll.

**Solución**:
```tsx
// Filas internas del asiento expandido
<tr className="py-1"> // Antes: py-3 o py-4
  <td>1041</td>
  <td>Cuentas Corrientes Operativas</td>
  <td className="text-right">S/ 5,000.00</td>
</tr>
```

**Regla**: Los contadores prefieren **densidad de información** sobre "aire" estético.

---

### 1.3 Tipografía Numérica

**Acierto**: Uso de fuente monoespaciada para montos.

**Mejora Crítica**: Alinear decimales verticalmente.

```css
/* globals.css */
.amount, .currency {
  font-variant-numeric: tabular-nums;
}
```

```tsx
// En Tailwind
<span className="tabular-nums">S/ 14,376.24</span>
```

---

## 2. Cumplimiento Contable (SUNAT - Perú)

### 2.1 CUO - Código Único de la Operación

**Crítica**: No visible en la UI actual.

**Importancia**: El CUO es **vital** para cruzar información con SUNAT (PLE/SIRE).

**Solución**:
```tsx
// Tooltip en Nº de Asiento
<span 
  title="CUO: M-202410-00123"
  className="cursor-help underline-dotted"
>
  05-00123
</span>

// O columna dedicada en vista compacta
<th>CUO</th>
```

### 2.2 Indicador de Partida Doble

**Acierto**: `"BALANCEADO / PARTIDA DOBLE VERIFICADA"` en verde = UX Orgasmic ✅

**Mejora para Descuadre**:
```tsx
{isBalanced ? (
  <Badge variant="success">BALANCEADO</Badge>
) : (
  <Badge variant="destructive">
    DESCUADRADO: Diferencia S/ {difference.toFixed(2)}
  </Badge>
)}
```

### 2.3 Centro de Costos

**Problema**: No visible en la fila de la cuenta (601, 63).

**Solución**: Agregar columna o badge inline:
```tsx
<td>
  601 - Mercaderías
  <span className="ml-2 text-xs text-muted-foreground">
    [CC: Producción]
  </span>
</td>
```

---

## 3. Arquitectura Técnica (Next.js + React)

### 3.1 Virtualización de Listas (OBLIGATORIO)

**Problema**: Miles de asientos al mes = DOM colapsado.

**Solución**:
```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function LibroDiario({ asientos }) {
  const virtualizer = useVirtualizer({
    count: asientos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // altura estimada de fila
  })
  
  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <AsientoRow 
            key={virtualRow.key}
            asiento={asientos[virtualRow.index]}
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          />
        ))}
      </div>
    </div>
  )
}
```

### 3.2 Estado en URL (Filtros Compartibles)

**Patrón Correcto**:
```
/contabilidad/libro-diario?q=factura&month=10&year=2024
```

**Implementación con `nuqs`**:
```tsx
import { useQueryState, parseAsString, parseAsInteger } from 'nuqs'

function LibroDiarioFilters() {
  const [search, setSearch] = useQueryState('q', parseAsString)
  const [month, setMonth] = useQueryState('month', parseAsInteger)
  const [year, setYear] = useQueryState('year', parseAsInteger)
  
  // Filtros sincronizados con URL
}
```

**Beneficio**: Contador puede compartir link exacto a auditor/colega.

### 3.3 Server Components + Lazy Loading

```tsx
// app/contabilidad/libro-diario/page.tsx (Server Component)
async function LibroDiarioPage({ searchParams }) {
  const totales = await getTotalesLibroDiario(searchParams)
  
  return (
    <div>
      <TotalesHeader totales={totales} />
      <Suspense fallback={<AsientosListSkeleton />}>
        <AsientosList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
```

### 3.4 Compound Components (Código Limpio)

```tsx
<AsientoRow>
  <AsientoRow.Header>
    <AsientoRow.Number>05-00123</AsientoRow.Number>
    <AsientoRow.Date>27/10/2024</AsientoRow.Date>
    <AsientoRow.Glosa>Cobro de Factura F001-456</AsientoRow.Glosa>
    <AsientoRow.Total>S/ 5,000.00</AsientoRow.Total>
  </AsientoRow.Header>
  
  <AsientoRow.Detail>
    <AsientoRow.Line cuenta="1041" descripcion="Cuentas Corrientes" debe={5000} />
    <AsientoRow.Line cuenta="1212" descripcion="Emitidas en Cartera" haber={5000} />
  </AsientoRow.Detail>
  
  <AsientoRow.Actions>
    <AsientoRow.Status status="mayorizado" />
    <AsientoRow.PLEStatus declared={true} />
  </AsientoRow.Actions>
</AsientoRow>
```

---

## 4. Checklist de Implementación

- [ ] Aumentar contraste de textos secundarios (`text-gray-300`)
- [ ] Aplicar `tabular-nums` a todos los montos
- [ ] Compactar padding en filas expandidas (`py-1`)
- [ ] Agregar CUO visible (tooltip o columna)
- [ ] Mostrar diferencia exacta en descuadres
- [ ] Agregar Centro de Costos inline
- [ ] Implementar TanStack Virtual para listas
- [ ] Migrar filtros a URL state con `nuqs`
- [ ] Usar Compound Components para AsientoRow

---

*Documento generado: 2025-12-13*
*Contexto: Landing Page → Aplicación Real*
