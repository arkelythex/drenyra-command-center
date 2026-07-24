---
status: reference
normative: false
consumed_by: SDD-014
---

---
title: "SDD-006 — Sistema de Evidencia Fiscal"
description: "Fuente, razonamiento, nivel de confianza por acción — el sistema que hace que Drenyra sea explicable por diseño"
version: "1.0"
status: "draft"
priority: "P0 — Fundacional"
wave: "2 — Fiscal Trust Core"
depends_on:
  - SDD-002 (Contratos de confianza — Evidence contract)
  - SDD-003 (Arquitectura de Información — entity taxonomy)
  - SDD-005 (Accesibilidad — estados multi-sensoriales)
---

**Última actualización**: 2026-07-14
**Content type**: Specification
**Status**: Draft
**Priority**: P0 — Fundacional

---

## 1. Abstract

El problema fundamental de la AI en fiscalidad no es la precisión — es la **confianza**. Un contador no va a aceptar una recomendación porque "la AI lo dice". Necesita saber de dónde viene cada dato, qué razonamiento lo respalda, y qué tan seguro está el sistema.

Este SDD define cómo Drenyra presenta evidencia: no como un panel técnico oculto, sino como parte integral de cada recomendación, cada acción, cada estado. La evidencia no es un extra — es el producto.

## 2. North star

> Cada recomendación en Drenyra viene con su certificado de origen. El usuario nunca tiene que preguntar "¿por qué?"

Si un contador ve un warning de IGV, debe poder responder: ¿dato SUNAT o calculado? ¿qué comprobantes lo componen? ¿qué confianza tiene el sistema? — todo desde el mismo lugar, sin abrir otra pantalla.

## 3. Problem statement

1. **Caja negra AI**: Las recomendaciones actuales de Drenyra aparecen sin fuente visible. El usuario confía por fe o no confía.
2. **Evidencia dispersa**: Los datos de origen están en una pantalla, el razonamiento en otra, el resultado en otra. El usuario no puede tracear la decisión.
3. **Confianza sin granularidad**: "Confianza: 85%" no significa nada sin contexto. ¿85% de qué? ¿basado en qué? ¿desde cuándo?
4. **Overload de evidencia**: Mostrar TODO el razonamiento es tan malo como mostrar nada. El usuario necesita profundidad progresiva (invariant 7).
5. **Sin estándar de evidencia**: Cada recomendación muestra evidencia diferente. No hay consistencia perceptual (invariant 11).

## 4. Research context

### 4.1 Vínculo con SDD-002 — Contrato de Evidence

SDD-002 define que toda recomendación debe mostrar fuente, razonamiento, y nivel de confianza. SDD-006 es la implementación concreta.

| Contrato | Requerimiento de evidencia |
|----------|---------------------------|
| Evidence | Fuente de cada dato, razonamiento de cada conclusión |
| Progressive Disclosure | Evidencia a 3 profundidades: resumen → detalle → raw data |
| Audit Trail | Toda recomendación registrada con su evidencia |

### 4.2 Vínculo con SDD-003 — Taxonomía de entidades

Cada entidad fiscal (comprobante, declaración, tributo) necesita un tipo de evidencia específico:

| Entidad fiscal | Tipo de evidencia principal |
|---------------|---------------------------|
| Comprobante | ORIGEN: SUNAT (CDR), usuario (carga), sistema (generado) |
| Declaración | CÁLCULO: fórmula aplicada, comprobantes agregados, tributos |
| Detracción | REGLA: normativa legal aplicada, tasa, período |
| Conciliación | MATCH: comprobante vs declaración, diferencia, estado |
| Reporte | AGREGACIÓN: fuente de cada fila, período, ajustes |

## 5. Invariantes afectados

1. **Explicabilidad AI**: Toda recomendación muestra fuente + razonamiento + confianza
2. **Evidencia primero**: Datos crudos siempre accesibles
3. **Progressive disclosure**: 3 niveles de profundidad
4. **Consistencia perceptual**: Mismo patrón de evidencia en toda la app
5. **Audit trail**: Toda recomendación queda registrada con su evidencia

## 6. Modelo de evidencia

### 6.1 Fuentes de evidencia

| Tipo de fuente | Descripción | Confianza base | Ejemplo |
|---------------|-------------|----------------|---------|
| `sunat` | Dato obtenido directamente de SUNAT (API, archivo) | Alta (95-99%) | "RUC activo y habido — SUNAT 2026-07-14" |
| `user` | Dato ingresado por el usuario o su contador | Media (80-95%) | "Comprobante F001-123 cargado por usuario 2026-07-13" |
| `derived` | Dato calculado por el sistema a partir de otros datos | Media (75-95%) | "IGV calculado: S/ 228.00 = S/ 1,200.00 × 19%" |
| `inferred` | Dato inferido por AI basado en patrones | Baja (60-80%) | "Posible duplicado: similitud 92% con F001-120" |
| `rule` | Dato basado en normativa fiscal peruana | Alta (99%) | "Tasa detracción: 10% — según Decreto Supremo 123-2025-EF" |
| `configured` | Dato configurado por administrador del tenant | Alta (95%) | "Plan contable personalizado: versión 2.3" |

### 6.2 Niveles de profundidad de evidencia

Cada acción/recomendación tiene 3 niveles de profundidad:

| Nivel | Nombre | Contenido | Acceso |
|-------|--------|-----------|--------|
| **L0** | Resumen | Fuente + confianza + veredicto en una línea | Visible siempre, sin clic |
| **L1** | Detalle | Razonamiento paso a paso, fórmulas, reglas aplicadas | Un clic para expandir |
| **L2** | Raw data | Datos de origen en bruto, JSON, consulta SQL, API response | Dos clics o "Ver fuente" |

### 6.3 Confidence Score

El confidence score no es un número mágico. Es un desglose:

```typescript
interface ConfidenceScore {
  overall: number;           // 0.0 - 1.0 (lo que ve el usuario)
  
  breakdown: {
    data_quality: number;    // ¿Los datos de origen están completos y actualizados?
    source_reliability: number; // ¿Qué tan confiable es la fuente?
    model_confidence: number;   // ¿Qué tan seguro está el modelo (si aplica)?
    rule_match: number;      // ¿Qué tan bien coincide con reglas fiscales?
  };
  
  factors: string[];         // Qué afectó la confianza
  // Ej: ["Dato SUNAT actualizado hace 2 horas", 
  //      "Inferencia basada en 150 comprobantes similares"]
  
  updated_at: string;        // ISO 8601
}
```

**Display**:
- 95-100%: Mostrar como número exacto (fuente directa)
- 80-94%: Mostrar como rango o barra (cálculo/recomendación)
- 60-79%: Mostrar con advertencia (inferencia)
- <60%: No mostrar como recomendación autónoma (requiere revisión humana)

## 7. Patrones de UI de evidencia

### 7.1 Evidence Tag (L0)

El tag de evidencia es el bloque atómico que acompaña cada acción/recomendación:

```
[🔵 SUNAT · Alta · Hoy 14:30]          ← Estado válido
[🟡 Inferido · Baja · 60%]            ← Estado con advertencia
[🔴 No verificado · Sin fuente]        ← Estado crítico
```

**Reglas**:
- Siempre visible junto a la acción/recomendación
- Color + icono + texto (redundancia sensorial, SDD-005)
- Tooltip en hover/focus muestra breakdown completo
- Click/focus expande a L1

### 7.2 Evidence Panel (L1)

Panel expandible que aparece al hacer clic en el tag:

```html
<div class="evidence-panel" role="region" aria-label="Detalle de evidencia">
  <h3>Evidencia: Discrepancia en IGV</h3>
  
  <dl class="evidence-breakdown">
    <dt>Fuente</dt>
    <dd>
      <span class="evidence-source" data-source="sunat">SUNAT · CDR</span>
      <time datetime="2026-07-14T14:30:00Z">Actualizado hoy 14:30</time>
    </dd>
    
    <dt>Confianza</dt>
    <dd>
      <meter value="0.88" min="0" max="1" low="0.6" optimum="0.9">88%</meter>
      <ul class="confidence-factors">
        <li>Dato SUNAT actualizado hace 2h</li>
        <li>IGV declarado vs IGV calculado: diferencia de S/ 1,234.00</li>
        <li>3 comprobantes en periodo sin declarar</li>
      </ul>
    </dd>
    
    <dt>Razonamiento</dt>
    <dd>
      <ol class="reasoning-chain">
        <li>17 comprobantes emitidos en período 2026-06</li>
        <li>Total IGV calculado: S/ 12,830.00</li>
        <li>IGV declarado en PDT 621: S/ 11,596.00</li>
        <li>Diferencia: S/ 1,234.00 (no declarado)</li>
      </ol>
    </dd>
  </dl>
  
  <button aria-expanded="false">
    Ver datos fuente (L2)
  </button>
</div>
```

### 7.3 Evidence Viewer (L2)

Vista completa de datos fuente. Acceso explícito con clic en "Ver datos fuente":

- Para datos SUNAT: respuesta API formateada con sintaxis resaltada
- Para datos calculados: fórmula expandida + valores intermedios
- Para inferencias: inputs del modelo + factores de decisión
- Para reglas: texto legal con enlace a la normativa

**Reglas**:
- L2 nunca se abre automáticamente. Siempre requiere acción del usuario.
- L2 es colapsable y no bloquea la pantalla (panel lateral expandido)
- L2 incluye timestamp de cada dato individual

## 8. Mapeo L0-L3 por tipo de evidencia

| Tipo de acción | L0 (Explain) | L1 (Recommend) | L2 (Prepare) | L3 (Execute) |
|---------------|-------------|----------------|-------------|-------------|
| Discrepancia IGV | "Hay diferencia de S/ 1,234" | "Declarar IGV faltante" | Draft de declaración preparado | Auto-declarar (si riesgo < bajo) |
| Duplicado comprobante | "Posible duplicado" | "Revisar F001-120 vs F001-121" | Tabla comparativa | Marcar como duplicado (con undo) |
| Vencimiento próximo | "Vence en 3 días" | "Programar pago" | Orden de pago preparada | Pagar (solo si configurado) |
| Error de forma | "Serie no coincide con RUC" | "Corregir serie" | Formulario precargado | Auto-corregir (solo errores triviales) |
| Detracción faltante | "Detracción no aplicada" | "Aplicar detracción 10%" | Asiento preparado | Aplicar (con reversión habilitada) |

## 9. Estados de evidencia

Cada evidencia tiene un estado que determina su display:

| Estado | Significado | Display | Acción del usuario |
|--------|------------|---------|-------------------|
| `verified` | Fuente confirmada, dato actual | Tag azul + check | Consumir confiadamente |
| `stale` | Fuente conocida pero dato >24h sin refrescar | Tag azul claro + reloj | Refrescar o verificar manualmente |
| `conflict` | Dos fuentes contradictorias | Tag ámbar + ⚠ | Revisar y elegir fuente primaria |
| `unverified` | Fuente desconocida o no confirmada | Tag gris + ? | Verificar manualmente |
| `error` | Error al obtener fuente | Tag rojo + ✗ | Reintentar o reportar |

## 10. Evidencia en acciones del usuario

No solo las recomendaciones AI llevan evidencia. Las acciones del usuario también:

| Acción del usuario | Qué se registra como evidencia |
|-------------------|-------------------------------|
| Contador carga comprobante | Archivo original + hash + timestamp + usuario |
| Contador aprueba recomendación | Qué vio antes de aprobar + tiempo de revisión |
| Contador revierte acción | Estado previo + motivo + timestamp |
| Contador exporta reporte | Filtros aplicados + fecha de datos + versión del sistema |

Esto cumple el contrato de Audit Trail (SDD-002) y asegura que toda acción sea trazable.

## 11. Estrategia de implementación

### 11.1 Paquete compartido

El sistema de evidencia se implementa como un paquete `packages/evidence/` que:

- Define los tipos y interfaces del modelo de evidencia
- Provee componentes UI (EvidenceTag, EvidencePanel, EvidenceViewer)
- Maneja la lógica de confidence scoring
- Se integra con el sistema de telemetría (SDD-004) para medir cuánto usan los usuarios la evidencia

### 11.2 Fases

| Fase | Alcance | Componentes |
|------|---------|------------|
| **Fase 1** | Tipos + modelo + EvidenceTag (L0) | Tags en acciones principales |
| **Fase 2** | EvidencePanel (L1) | Detalle expandible en acciones críticas |
| **Fase 3** | EvidenceViewer (L2) + raw data access | Panel lateral para usuarios avanzados |
| **Fase 4** | Integración con todas las verticales | SIRE, detracciones, conciliación, reporting |

## 12. Métricas de éxito

| Métrica | Target | Cómo se mide (SDD-004) |
|---------|--------|------------------------|
| Evidence view rate (L0→L1) | >40% | Clicks en EvidenceTag / acciones totales |
| Deep evidence rate (L1→L2) | >10% | Clicks en "Ver datos fuente" / L1 opens |
| Trust Velocity (de SDD-004) | Curva descendente en 4 semanas | Acceptance sin ver L1 en semanas 3-4 |
| User satisfaction con evidencia | >4/5 en encuesta | NPS específico de evidencia |
| Error rate en acciones con evidencia | <5% (vs >15% sin evidencia) | Acciones sin evidencia previa vs con evidencia |

## 13. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Evidence overload: mostrar demasiada info abruma al usuario | Alta | Medio | Progressive disclosure estricto (L0 siempre, L1 un clic, L2 dos clics) |
| Confianza falsa: usuario confía ciegamente en evidencia bien presentada | Media | Alto | Confidence score siempre visible con breakdown, no solo número |
| Costo de implementación: cada acción necesita evidencia diferente | Alta | Alto | Paquete compartido de tipos + componentes reutilizables |
| Datos stale mostrados como actuales | Media | Alto | Timestamp en cada evidencia, color de estado cambia con edad |

## 14. Dependencias

| SDD | Relación |
|-----|----------|
| SDD-002 (Contratos) | Define el QUÉ de evidencia, SDD-006 el CÓMO |
| SDD-003 (IA) | Taxonomía de entidades fiscales para tipos de evidencia |
| SDD-004 (Telemetría) | Medición de uso de evidencia |
| SDD-005 (Accesibilidad) | Estados multi-sensoriales para evidencia |
| SDD-007 (Modelo L0-L3) | Mapeo de niveles de asistencia por tipo de evidencia |

## 15. Acceptance criteria

- [ ] Modelo de evidencia definido con tipos, fuentes, confidence score
- [ ] EvidenceTag (L0) implementado en acciones principales
- [ ] EvidencePanel (L1) implementado con breakdown de confianza + razonamiento
- [ ] EvidenceViewer (L2) implementado para datos raw
- [ ] 5 tipos de fuente implementados (sunat, user, derived, inferred, rule)
- [ ] Estados de evidencia (verified, stale, conflict, unverified, error) funcionales
- [ ] Confidence score con breakdown visible
- [ ] Evidence view rate instrumentado en telemetría (SDD-004)
- [ ] Paquete `packages/evidence/` creado con API estable
- [ ] Accesibilidad: estados multi-sensoriales, ARIA, keyboard nav

## 16. DONE criteria (gate G2)

1. Tres niveles de profundidad (L0/L1/L2) operativos
2. Confidence score con breakdown funcional
3. 5 tipos de fuente implementados y diferenciados visualmente
4. Evidence view rate >40% medido en sesiones de prueba
5. Paquete `packages/evidence/` documentado con ejemplos
6. Pruebas de accesibilidad del EvidenceTag + Panel pasadas

---

**Siguiente**: SDD-007 — Modelo L0-L3 de Asistencia AI
