# EdgeTraz Agro: Plataforma de Trazabilidad Agro-Industrial con IA + Rust en el Edge
<img width="1885" height="988" alt="image" src="https://github.com/user-attachments/assets/436e9f6c-7564-43f2-9865-9850d7235b30" />

![Status](https://img.shields.io/badge/Status-MVP_Phase-blue)
![Tech](https://img.shields.io/badge/Stack-Rust_|_IA_|_Next.js-orange)
![Market](https://img.shields.io/badge/Focus-Piura_Export_2026-green)

> **🏢 ARKELYTHEX Ecosystem** — This project is part of the [ARKELYTHEX](https://github.com/arkelythex) venture studio.  
> The primary development hub is the [ARKELYTHEX monorepo](https://github.com/arkelythex/Arkelythex).

**EdgeTraz Agro** es una solución de vanguardia diseñada para la agroexportación peruana (Mango, Uva, Limón). Utiliza computación en el borde (Edge Computing) con Rust para garantizar la inmutabilidad de los datos, procesamiento sin conexión a internet y trazabilidad completa desde la parcela hasta el puerto de destino.

## 🚀 Visión 2026
En un contexto donde las agroexportaciones peruanas superan los US$14,600 millones, EdgeTraz Agro permite a los productores de Piura y el norte del país reducir los rechazos en destino, optimizar el uso de recursos y cumplir con las normativas más estrictas de Europa y EE.UU. (GlobalG.A.P, FSMA).

## ✨ Funcionalidades Clave del MVP
- **Rust Edge Engine**: Procesamiento local en dispositivos IoT (ESP32/Raspberry Pi) para detección temprana de plagas y estrés hídrico sin dependencia de la nube.
- **Trazabilidad Inmutable**: Registro de eventos (siembra, cosecha, empaque) mediante un Ledger distribuido ligero y firmas digitales.
- **IA Predictiva**: Modelos TinyML desplegados en el edge para predicción de rendimientos y alertas fitosanitarias.
- **Offline-First Sync**: Sincronización inteligente con protocolos de reintento e idempotencia para zonas con baja conectividad.
- **Dashboard de Auditoría**: Reportes automáticos para SENASA y certificaciones internacionales.

## 🛠 Stack Técnico
- **Edge**: Rust (`tokio`, `embassy`, `rusqlite`), TensorFlow Lite (Edge AI).
- **Backend**: Rust (Axum) + PostgreSQL (TimescaleDB para telemetría).
- **Frontend**: Next.js 15 + Tailwind CSS + Framer Motion.
- **Comunicaciones**: MQTT (Mosquitto), LoRaWAN para largo alcance en campo.

## 📦 Estructura del Proyecto
```text
.
├── docs/                   # Documentación técnica y de negocio
│   ├── SPEC-001-Core.md    # Especificación funcional y técnica
│   ├── Architecture.md     # Diagramas y flujos de datos
│   └── Edge-Cases.md       # Matriz de riesgos y casos de borde
├── edge/                   # Código fuente del Gateway en Rust
├── backend/                # API Central en Rust
└── frontend/               # Dashboard Web en Next.js
```

## 🛠 Instalación y Uso (Ejemplo rápido)

### Requisitos
- Rust 1.80+
- Node.js 22+
- Docker (para base de datos local)

### Ejecución del Edge Simulator
```bash
cd edge
cargo run --bin simulator
```

## 📈 Plan de Lanzamiento
1. **Validación (Q1 2026)**: Pilotos en Chulucanas y Tambogrande.
2. **MVP Desarrollo (Q2 2026)**: Implementación de trazabilidad crítica.
3. **Escalamiento (Q3 2026)**: Postulación a ProInnóvate / Startup Perú.

---
**Desarrollado por:** DreamCoder Team (Ronald, José Luis, [Tu Nombre])
**Financiamiento Objetivo:** ProInnóvate Startup Perú 2026 (S/67,000+)
---

## 🌐 ARKELYTHEX Ecosystem

| Component | Description |
|-----------|-------------|
| [ARKELYTHEX Monorepo](https://github.com/arkelythex/Arkelythex) | Primary development hub — fiscal intelligence platform |
| [Digital Public Peru](https://github.com/arkelythex/Digital_Public_peru) | Civic tech for fiscal transparency |
| [elect-validate](https://github.com/arkelythex/elect-validate) | Electoral act validation suite |
| [EdgeTraz-Agro](https://github.com/arkelythex/EdgeTraz-Agro) | Agro-industrial traceability |
| [Founder](https://github.com/Dreamcoder08) | Dreamcoder08 — Software Architect · GDE |
