# SPEC-001: Core Platform - EdgeTraz Agro (2026)

## 1. Resumen Ejecutivo
**EdgeTraz Agro** es una plataforma de trazabilidad agro-industrial offline-first desarrollada en **Rust**. Su objetivo es garantizar la inmutabilidad y transparencia de la cadena de suministro de agroexportación en la región de Piura, Perú, permitiendo el procesamiento en el borde (edge) para mitigar los problemas de conectividad rural.

## 2. Contexto de Mercado (2026)
- **Crecimiento**: Exportaciones agroindustriales peruanas proyectadas en >US$14,500 millones (2025/2026).
- **Demanda**: Exigencia europea de trazabilidad digital completa para Mango y Uva.
- **Diferenciador**: El uso de Rust permite dispositivos de bajo costo (ESP32/Raspberry Pi) con alta seguridad y eficiencia energética.

## 3. Requerimientos de Sistema

### 3.1 Funcionales (Must Have)
- **Captura Inmutable**: Todo dato es un evento firmado digitalmente.
- **Offline-First**: Capacidad de operar 100% offline durante días.
- **Trazabilidad Granular**: Lote → Parcela → Cosecha → Empaque → Contenedor.
- **Alertas de IA**: Detección de anomalías térmicas o estrés hídrico en el edge.

### 3.2 No Funcionales
- **Seguridad**: Comunicación mTLS y firma Ed25519.
- **Rendimiento**: Latencia de ingesta < 50ms en el edge.
- **Escalabilidad**: Soporte para hasta 1,000 dispositivos por gateway.

## 4. Plan de Implementación (Roadmap)

### Fase 1: Validación y Prototipado (Mes 1)
- Entrevistas con productores en Chulucanas y Sullana.
- Prototipo de sensores (Temperatura/Humedad) con Rust + Embassy.

### Fase 2: MVP Técnico (Mes 2-4)
- Desarrollo del motor de persistencia local (SQLite WAL).
- Implementación de protocolo de sincronización central.
- Dashboard básico de trazabilidad.

### Fase 3: Certificación y Auditoría (Mes 5-6)
- Integración de firmas Merkle para auditorías rápidas.
- Pruebas piloto en 2 fundos reales de exportación de mango.

## 5. Estrategia de Financiamiento
- **ProInnóvate / Startup Perú 11G (2026)**: Postulación para capital semilla (hasta S/67,000).
- **Hub UDEP**: Mentoría e incubación en Piura para acelerar el despliegue local.
- **Partnerships**: Alianzas con empacadoras de mango para validación de procesos de packing.

## 6. Equipo Recomendado
- **Líder Técnico (Rust/Backend)**: Ronald (Ing. Informática).
- **Especialista de Dominio (Agro/Seguridad)**: José Luis (Ing. Ambiental).
- **Estrategia y Negocios**: Tú (Gestión y validación de campo).

---
*Este documento es propiedad de EdgeTraz Agro. Última actualización: Febrero 2026.*
