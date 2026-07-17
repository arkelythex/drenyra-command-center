# Regulatory Guide — Operaciones Mineras con Drones en Sudamérica

> Guía práctica de regulaciones ANAC, DGAC, MTC y DGPSA para operaciones mineras con UAVs en la región andina.
> Actualización: 2025–2026.

---

## General Framework

### International Standards (Referencia)

| Estándar | Alcance | Aplicación en Minería |
|----------|---------|----------------------|
| JARUS (Joint Authorities for Rulemaking on Unmanned Systems) | Guidelines for UAS airworthiness, ops, and pilot competency | Base para BVLOS en varios países andinos |
| ISO 21384 (Unmanned Aircraft Systems) | UAS classification, safety management | Marco para SMS en operaciones mineras permanentes |
| ASTM F3269 (UAS Detect and Avoid) | DAA requirements | Aplicable a BVLOS en tajo abierto |
| ICAO UAS Toolkit | State-level regulatory guidance | Adoptado en distinto grado por ANAC, DGAC, MTC |

### Common Requirements Across Countries

- Registro de aeronave ante autoridad aeronáutica
- Seguro de responsabilidad civil (RC) vigente
- Piloto certificado (examen teórico + vuelo)
- Mantenimiento registrado según manual del fabricante
- Análisis de riesgo (SORA / SORA-lite) para operaciones complejas
- Notificación previa al vuelo (diferente plazo según el país)

---

## Argentina — ANAC (Administración Nacional de Aviación Civil)

### Regulación Principal
**RAAC 91 — Requisitos para Operaciones con Drones** (actualizada 2025)

### Weight Class Limitations

| Clase | Peso | Restricciones |
|-------|------|---------------|
| A (menor) | <500 g | Sin registro, sin permiso (en espacio no controlado) |
| B (liviano) | 500 g – 2 kg | Registro obligatorio, operación VLOS, altura máxima 43 m AGL |
| C (medio) | 2 kg – 20 kg | Registro + permiso ANAC, VLOS, 43 m AGL |
| D (pesado) | 20 kg – 150 kg | Certificado de aeronavegabilidad, piloto profesional |

*FPV Miner Drone Heavy-Lift X8 (~18 kg MTOW con payload): Clase C*
*FPV Miner Drone Scout Y6 (~6 kg MTOW): Clase C*

### Altitude Restrictions
- Máximo 43 m (140 ft) AGL en espacio aéreo no controlado
- Superable con permiso especial (Evaluación de Riesgo + autorización ANAC)
- Para minería en zonas de altura (>3000 m), la altitud sobre el terreno es la del vuelo, no la absoluta

### BVLOS Requirements
- **Permiso especial** — no existe habilitación general
- Requisitos:
  - Evaluación de Riesgo (SORA nivel III o superior)
  - Detect and Avoid (radar, visual observer, o sistemas automatizados)
  - Plan de contingencia detallado
  - Seguro RC ampliado (no menor a equivalentes 200,000 USD)
  - Comunicación redundante (4G/LTE o satelital)
- **Plazo estimado**: 60–90 días desde solicitud completa
- **Área minera**: Considerada "área restringida" si la mina es propiedad privada cerrada — simplifica pero no exime

### Insurance Requirements
- RC mínima: equivalente a 100,000 USD (Clase C)
- Para BVLOS: 500,000 USD recomendado
- Minas suelen exigir póliza específica en contratos con contratistas

### Pilot Certification
- **Piloto VANT** (habilitación ANAC): examen teórico + práctico
- Válido por 2 años, renovable
- Categorías: General / Avanzado / Especializado (minería entra en especializado)
- Requisitos: mayor de 18 años, apto psicofísico

### Mining-Specific Exemptions / Special Permits
| Aspecto | Detalle |
|---------|---------|
| Zona minera como área restringida | El titular puede solicitar restricción temporal de espacio aéreo sobre la mina |
| Vuelo sobre propiedad privada | Permitido con autorización del concesionario minero |
| Trabajo nocturno | Permiso especial ANAC (iluminación anticolisión + kit de noche obligatorio) |
| Transporte de carga | No regulado explícitamente para drones (vacío legal) — requiere permiso caso por caso |
| Exención de altura | Posible con SORA y plan de mitigación (zonas despobladas) |

### Procedimiento Práctico
1. Registrar aeronave en [ANAC VANT](https://vant.anac.gob.ar)
2. Obtener habilitación de piloto (curso aprobado en centro ANAC)
3. Solicitar permiso de operación para cada vuelo (o permiso anual para área minera)
4. Contratar seguro RC
5. Notificar a COTA (Control de Tránsito Aéreo) si el área está controlada
6. Para BVLOS: SORA completo + presentación ANAC (60–90 días antes)

---

## Chile — DGAC (Dirección General de Aeronáutica Civil)

### Regulación Principal
**DAN 151** (última actualización 2024) — Reglamento de Operaciones de Drones

### Weight Class Limitations

| Categoría | Peso | Restricciones |
|-----------|------|---------------|
| 1 | <750 g | Sin autorización DGAC, altura máxima 50 m AGL |
| 2 | 750 g – 25 kg | Registro + permiso DGAC, VLOS, 50 m AGL |
| 3 | >25 kg | Certificado de aeronavegabilidad |

### Altitude Restrictions
- Máximo 50 m AGL sobre zona no controlada
- Excepción: hasta 120 m con autorización previa (no residencial)
- Para minería en altura: la restricción es relativa al terreno

### BVLOS Requirements
- Autorización CASLA (Certificado de Autorización de Servicios de Low Altitude)
- Evaluación de Riesgo según metodología DGAC
- Sistema detect and avoid aprobado
- Comunicación redundante
- Observador visual (puede ser parte del equipo minero capacitado)
- **Difícil de obtener** — solo ~5 empresas mineras en Chile tienen permiso BVLOS activo en 2025

### Insurance Requirements
- RC mínima: 3,000 UF (~120,000 USD) para categoría 2
- Recomendado para minería: 10,000 UF (~400,000 USD)

### Pilot Certification
- Certificado de Operador DGAC (teórico + práctico en centro autorizado)
- Renovación cada 2 años
- Examen psicofísico clase IV (médico aeronáutico)

### Mining-Specific Exemptions / Special Permits

| Aspecto | Detalle |
|---------|---------|
| Permiso minero DGAC | La autorización se tramita con Informe Técnico de Operación (ITO) que la mina debe solicitar |
| Zona minera aislada | Menos restrictivo porque no hay población cercana |
| Sobrevuelo de faena | Autorizado con convenio empresa minera-DGAC |
| Trabajo nocturno | Autorización especial (iluminación + plan de contingencia) |
| Transporte de carga | No regulado — permiso especial DGAC requerido |
| BVLOS persistente | Posible mediante Acuerdo de Actividades Mineras con renovación anual |

### Procedimiento Práctico
1. Registrar aeronave en [DGAC Ventanilla Electrónica](https://ventanilla.dgac.gob.cl)
2. Obtener Certificado de Operador (piloto)
3. Solicitar CASLA para operaciones simples (VLOS, 50 m)
4. Para BVLOS: ITO + CASLA especial + presentar al Departamento Seguridad de Vuelo
5. Renovar CASLA anualmente mientras dure el contrato minero
6. Notificar a torre de control si hay aeropuerto minero (ej. El Salvador, Calama)

---

## Perú — MTC (Ministerio de Transportes y Comunicaciones)

### Regulación Principal
**RAP 101 — Reglamento de Aeronaves Pilotadas a Distancia** (actualización 2024)

### Weight Class Limitations

| Categoría | Peso | Restricciones |
|-----------|------|---------------|
| Ligero | <1.5 kg | Sin permiso (operación segura) |
| Mediano | 1.5 – 25 kg | Registro + permiso DGAC (DGA), limitaciones VLOS |
| Pesado | >25 kg | Certificado de aeronavegabilidad |

### Altitude Restrictions
- Máximo 121 m (400 ft) AGL
- Excepción para minería: hasta 150 m con autorización expresa

### BVLOS Requirements
- **Autorización previa del MTC** (no existe exención general)
- Requisitos:
  - Evaluación de Riesgos según SORA (nivel III+)
  - Detect and Avoid certificado
  - Enlace de control redundante
  - Observador visual adicional
  - Seguro con cobertura extendida
- **Beneficio minero**: OSINERGMIN (superintendencia de energía y minería) tiene convenio con MTC para operaciones mineras — facilita permisos

### Insurance Requirements
- RC mínima: 500,000 USD para categoría mediana
- Para operaciones mineras: 1,000,000 USD (recomendado por contrato)

### Pilot Certification
- Certificado DGA (Dirección General de Aeronáutica Civil)
- Curso teórico + examen en centro autorizado
- Práctico con instructor certificado
- Renovación anual

### Mining-Specific Exemptions / Special Permits

| Aspecto | Detalle |
|---------|---------|
| Permiso OSINERGMIN-MTC | Convenio especial que reduce tiempos de aprobación |
| Zona minera remota | No hay restricciones de sobrevuelo poblacional |
| Trabajo nocturno | Autorización MTC (equipo especial obligatorio) |
| Transporte de carga | Vacío legal — se permite si es operación interna de la mina |
| BVLOS continuo | Permiso por proyecto (ej. monitoreo de presa por 1 año renovable) |
| Inspección de túneles | Considerada operación en espacio confinado, no sujeto a restricciones de espacio aéreo |

### Procedimiento Práctico
1. Registrar aeronave en MTC (plataforma única)
2. Certificación de piloto DGA
3. Solicitar permiso de operación MTC (+ carta de la empresa minera)
4. Si es BVLOS: adjuntar SORA + convenio OSINERGMIN (recomendado)
5. Coordinar con CORPAC (control de tránsito aéreo) si la mina está cerca de aeropuertos
6. Notificar vuelos cada 30 días (operación continua → notificación única renovable)

---

## Bolivia — DGPSA (Dirección General de Aeronáutica Civil)

### Regulación Principal
**RAB 112 — Reglamento de Aeronaves No Tripuladas** (aprobado 2023, parcialmente implementado)

### Estado Actual
- **Marco regulatorio en desarrollo** — implementación gradual
- Autoridades responsables: DGPSA + COMIBOL (minería estatal)
- Operaciones mineras actualmente se manejan con permisos temporales

### Weight Class Limitations

| Categoría | Peso | Restricciones |
|-----------|------|---------------|
| 1 | <500 g | Libre (áreas no controladas) |
| 2 | 500 g – 2 kg | Registro + notificación 48 h antes |
| 3 | 2 kg – 20 kg | Registro + permiso DGPSA + piloto certificado |
| 4 | >20 kg | Certificado aeronavegabilidad |

### Altitude Restrictions
- Máximo 120 m AGL (general)
- Excepciones para minería: vía permiso temporal

### BVLOS Requirements
- No regulado explícitamente en RAB 112
- Se maneja por autorización temporal caso por caso
- Requisitos informales:
  - Análisis de riesgo (no SORA — formato DGPSA)
  - Comunicación continua (radio VHF en sitio)
  - Observador visual

### Insurance Requirements
- RC: 50,000 USD mínimo (categoría 3)
- Recomendado para minería: 200,000 USD

### Pilot Certification
- Certificado DGPSA (examen teórico-práctico)
- Vigencia 2 años
- Centro autorizado: IASA (Instituto de Aviación Santa Ana) — La Paz

### Mining-Specific Exemptions / Special Permits

| Aspecto | Detalle |
|---------|---------|
| Convenio COMIBOL-DGPSA | Áreas mineras estatales pueden gestionar permiso marco anual |
| Zona minera remota | No hay restricción poblacional |
| Inspección de infraestructura | Permitida con autorización de operador minero |
| Transporte de carga | Vacío legal — no regulado, no prohibido |
| BVLOS | Permiso temporal por faena (renovable cada 6 meses) |

### Procedimiento Práctico
1. Registrar aeronave en DGPSA
2. Obtener certificado de piloto
3. Solicitar permiso temporal de operación (20–30 días hábiles)
4. Si hay convenio COMIBOL: adjuntar carta de respaldo de la empresa minera
5. Coordinar con la región operativa de la DGPSA local
6. Pagar tasas de navegación (montos variables según región)

---

## Country Comparison Matrix

| Aspecto | Argentina (ANAC) | Chile (DGAC) | Perú (MTC) | Bolivia (DGPSA) |
|---------|-----------------|--------------|------------|-----------------|
| **Madurez regulatoria** | Alta | Alta | Media-Alta | Baja |
| **Tiempo permiso VLOS** | 2–4 semanas | 1–3 semanas | 2–6 semanas | 4–8 semanas |
| **Tiempo permiso BVLOS** | 60–90 días | 90–180 días | 60–120 días | Por definir (temporal) |
| **Altura máxima** | 43 m | 50 m | 121 m | 120 m |
| **Peso tope sin permiso** | <500 g | <750 g | <1.5 kg | <500 g |
| **Seguro RC mínimo** | 100k USD | 120k USD | 500k USD | 50k USD |
| **Exención minera** | Área restringida | ITO minero | Convenio OSINERGMIN | COMIBOL |
| **BVLOS factible** | Sí (difícil) | Sí (muy difícil) | Sí (moderado) | Sí (temporal) |
| **Transporte de carga** | Vacío legal | No regulado | No regulado | No regulado |
| **Vuelo nocturno** | Permiso especial | Permiso especial | Permiso MTC | No regulado |
| **Registro aeronave** | Obligatorio | Obligatorio | Obligatorio | Obligatorio |

---

## SORA (Specific Operational Risk Assessment) para Minería

### Niveles Típicos por Perfil de Misión

| Misión | SAIL (SORA Level) | Características |
|--------|-------------------|-----------------|
| Open-Pit Survey (VLOS) | I–II | Zona despoblada, VLOS, <120 m |
| Open-Pit Survey (BVLOS) | III–IV | BVLOS, área controlada minera |
| Tunnel Inspection | III | Pérdida de link, sin GPS |
| Equipment Inspection | II | VLOS, distancia corta |
| Supply Transport | IV | BVLOS, sobrevuelo de personal, >25 kg MTOW |
| Tailings Monitoring | III–IV | BVLOS, área sensible (presa) |

### Documentación Mínima para SORA

1. **Descripción de la operación** (CONOPS)
2. **Análisis de riesgo en tierra** (GRC — Ground Risk Class):
   - Densidad poblacional en zona de operación
   - Zona minera = escasamente poblada (GRC bajo, generalmente 3–5)
3. **Análisis de riesgo en aire** (ARC — Air Risk Class):
   - Tráfico aéreo: depende del espacio aéreo (G → bajo, controlado → alto)
   - Minas alejadas → ARC bajo (salvo aeropuertos mineros)
4. **Mitigaciones tácticas**:
   - Paracaídas balístico
   - Redundancia de sistemas
   - Geofence 3D
   - Comunicación redundante
5. **Manual de operaciones** (SOP — Standard Operating Procedures)
6. **Plan de contingencia** para cada fallo identificado

---

## Recomendaciones Prácticas por País

### Argentina
- Iniciar con permiso de área restringida (la mina lo solicita a ANAC)
- El permiso de vuelo sobre propiedad minera es más simple si la mina es privada
- Para BVLOS, contratar consultora aeronáutica con experiencia ANAC
- **Contacto ANAC**: Dirección de Normas Aeronáuticas — área VANT

### Chile
- El ITO minero es la clave — trabajar con el departamento de seguridad de la mina
- CASLA para categoría 2 es rápido (3 semanas)
- BVLOS requiere abogado aeronáutico especializado
- **Contacto DGAC**: Departamento Servicios de Tránsito Aéreo — CASLA

### Perú
- Aprovechar el convenio OSINERGMIN-MTC para agilizar trámites
- Las minas peruanas más grandes (Antamina, Las Bambas, Cerro Verde) ya tienen procesos establecidos
- BVLOS es más factible que en Chile o Argentina
- **Contacto MTC**: Dirección General de Aeronáutica Civil — Subdirección de Operaciones

### Bolivia
- Realidad operativa: la DGPSA tiene poca fiscalización — las minas operan con permisos temporales
- Se recomienda obtener permiso formal para actividad regular
- Las minas de COMIBOL (Huanuni, Colquiri) tienen procesos más sencillos
- **Contacto DGPSA**: Dirección de Seguridad Aérea

---

## Glosario

| Término | Significado |
|---------|-------------|
| VLOS | Visual Line of Sight — línea de visión directa |
| BVLOS | Beyond Visual Line of Sight — más allá de la línea de visión |
| SAIL | Specific Assurance and Integrity Level (de SORA) |
| SORA | Specific Operational Risk Assessment |
| RC | Responsabilidad Civil (seguro) |
| ITO | Informe Técnico de Operación (Chile) |
| CASLA | Certificado de Autorización de Servicios de Low Altitude (Chile) |
| GCS | Ground Control Station |
| MTOW | Maximum Take-Off Weight |
| CONOPS | Concept of Operations |
| DAA | Detect and Avoid |
| LRF | Laser Range Finder |

---

> **Disclaimer**: Esta guía es informativa y no constituye asesoría legal. Las regulaciones cambian frecuentemente. Se recomienda contratar consultoría aeronáutica local y verificar el estado actual con cada autoridad antes de operar. Las empresas mineras suelen tener departamentos legales y de sostenibilidad que pueden gestionar estos permisos.
