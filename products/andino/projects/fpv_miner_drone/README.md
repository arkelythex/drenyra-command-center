# FPV Miner Drone

> Dron autónomo para inspección, vigilancia y transporte de carga en minería de gran altitud en la región Andina.

**Estado**: `📐 Planeamiento` — definición de especificaciones.

---

## Project Overview

**FPV Miner Drone** es una plataforma aérea no tripulada diseñada para operar en el entorno extremo de la minería andina (>3000 m s.n.m.). Combina capacidades de inspección visual/térmica, mapeo fotogramétrico, detección de gases y transporte de carga de emergencia en un solo ecosistema modular.

### Target Environment

| Parámetro | Valor | Impacto en diseño |
|-----------|-------|-------------------|
| Altitud operativa | 3000–5500 m s.n.m. | Derating de motores (hasta 40% menos lift), hélices de mayor paso, baterías con menor capacidad efectiva |
| Temperatura | -10°C a 40°C | Baterías LiPo requieren precalentamiento bajo 0°C; lubricantes de baja temperatura |
| Humedad relativa | 10–90% | Componentes sellados, conectores conformal coated |
| Polvo / partículas | Alta concentración (sílice, sulfatos) | IP5X mínimo en todas las carcasas; filtros en ventilación activa |
| Viento | Ráfagas hasta 15 m/s | Estabilización redundante, relación empuje-peso ≥ 2.5:1 |
| Interferencia electromagnética | Alta (maquinaria pesada, líneas de alta tensión) | Telemetría RF-inmune (915 MHz LoRa/LTE), filtros EMI en ESC |
| Visibilidad | Neblina, polvo en suspensión, poca luz en túneles | Cámara térmica + radar de proximidad + iluminación LED industrial |

---

## Mission Profiles

### 1. Tunnel Inspection (Inspección de Túneles)
Vuelo autónomo en túneles mineros (sin GPS) usando visual SLAM + LiDAR. Inspección visual y térmica de sostenimientos, sistemas de ventilación, y detección de puntos calientes en equipos.

### 2. Open-Pit Survey (Relevamiento de Cielo Abierto)
Fotogrametría aérea y LiDAR para modelado 3D de tajos abiertos. Cálculo de volúmenes de stockpiles, monitoreo de taludes, detección de grietas.

### 3. Equipment Inspection (Inspección de Equipos)
Vuelo de aproximación cercana a palas, camiones de extracción, chancadores y correas transportadoras. Fusión visual + térmica para detectar fallas incipientes.

### 4. Emergency Supply Transport (Transporte de Emergencia)
Entrega de carga crítica (primeros auxilios, repuestos, agua) en zonas de difícil acceso. Capacidad 5–10 kg con sistema de liberación servo-actuado.

### 5. Tailings Dam Monitoring (Monitoreo de Diques de Relaves)
Termografía multiespectral para detección de filtraciones, inestabilidad de taludes y estrés de vegetación en presas de relaves.

---

## Platform Selection

### Andino Heavy-Lift X8 (Octocóptero coaxial)

**Recomendado para**: Transporte de carga, misiones largas, payloads pesados (LiDAR + multispectral + gas sensors).

| Especificación | Valor |
|----------------|-------|
| Configuración | X8 coaxial (8 motores) |
| Payload máximo | 15 kg (@ nivel del mar) → 8 kg (@ 4500 m) |
| Autonomía | 25–35 min (cargado) |
| Diámetro | 960 mm (marco plegable) |
| Ventajas | Redundancia 4x en hover, tolerancia a viento 15 m/s |

### Andino Scout Y6 (Hexacóptero en Y)

**Recomendado para**: Inspección de túneles, vuelos interiores, mapeo rápido.

| Especificación | Valor |
|----------------|-------|
| Configuración | Y6 coaxial (6 motores) |
| Payload máximo | 3 kg (@ nivel del mar) → 1.5 kg (@ 4500 m) |
| Autonomía | 20–30 min |
| Diámetro | 550 mm |
| Ventajas | Compacto para túneles, menor inercia para maniobras |

### Criteria por Misión

| Misión | Plataforma | Razón |
|--------|-----------|-------|
| Tunnel Inspection | Scout Y6 | Tamaño reducido, maniobrabilidad |
| Open-Pit Survey | Heavy-Lift X8 | Carga útil para LiDAR + cámara |
| Equipment Inspection | Scout Y6 | Aproximación cercana segura |
| Supply Transport | Heavy-Lift X8 | Capacidad de carga |
| Tailings Monitoring | Heavy-Lift X8 | Payload multispectral completo |

---

## Payload Options

### Cámaras Térmicas

| Modelo | Resolución | Temp Range | Uso |
|--------|-----------|------------|-----|
| FLIR Vue Pro R | 640×512 | -20°C a 350°C | Hot spots en equipos eléctricos/rodamientos |
| DJI Zenmuse H20T | 640×512 radiométrica | -40°C a 550°C | Inspección general + fusión visual |
| InfiRay M300 | 640×512 | -25°C a 550°C | Alternativa económica |

### Multiespectral

| Modelo | Bandas | Uso |
|--------|--------|-----|
| MicaSense RedEdge-P | 5 + RGB | Estrés vegetal en relaves, NDVI |
| DJI P4 Multispectral | 5 + RGB | Alternativa integrada |

### LiDAR

| Modelo | Alcance | Precisión | Uso |
|--------|---------|-----------|-----|
| Ouster OS0-32 | 50 m | ±0.7 cm | Mapeo de túneles |
| Velodyne Puck LITE | 100 m | ±3 cm | Topografía de tajos |
| DJI Zenmuse L2 | 450 m | ±2 cm | Fotogrametría de gran escala |

### Sensores de Gas

| Gas | Sensor | Rango | Aplicación |
|-----|--------|-------|------------|
| CH4 | Figaro TGS2611 | 500–10000 ppm | Acumulación en túneles |
| CO | Figaro TGS5042 | 0–1000 ppm | Ventilación / motores diésel |
| NO2 | Alphasense NO2-B43F | 0–20 ppm | Voladuras / escapes |
| SO2 | Alphasense SO2-B4 | 0–100 ppm | Procesamiento de minerales |
| PM2.5/10 | Plantower PMS5003 | 0–1000 µg/m³ | Monitoreo ambiental |

### Módulo de Carga / Liberación

| Componente | Especificación |
|------------|---------------|
| Servo | HS-645MG (torque 7.7 kg·cm) |
| Mecanismo | Brazo servo-actuado con gancho |
| Sujeción | Bungee cord + pin electromagnético |
| Contenedor | Pelican 1060 Micro Case (IP67) |
| Peso máximo | 10 kg |

---

## Operational Requirements

### Altitude Compensation

| Altitud (m) | Lift Loss | Hélice recomendada | Batería derating | Corrección |
|-------------|-----------|-------------------|------------------|------------|
| 0 | 0% | 15×5.4 | 100% | — |
| 3000 | -25% | 16×5.8 | 85% | Aumentar pitch 10% |
| 4000 | -34% | 17×6.0 | 78% | Pack 6S → 8S |
| 5000 | -42% | 18×6.4 | 70% | Hélice tallada para altitud |

### Dust / Particulate Ingress

- **Motores**: Sellos de laberinto + bearings sellados (NSK 6902ZZ)
- **ESCs**: Conformal coating + carcasa IP56 con heatsink externo
- **FC / Companion**: Caja estanca IP67 (Pelican o similar), ventilación pasiva con filtro HEPA
- **Conectores**: Todos IP67 (XT90 AS para batería, GX16 para sensores)
- **Cámaras**: Ventana de zafiro o vidrio templado con limpia óptico (coating antiadherente)

### Emergency Failsafe

| Evento | Acción | Tiempo respuesta |
|--------|--------|-----------------|
| Pérdida de link RC | RTL automático + cambio a LoRa backup | 2 s |
| Pérdida de telemetría | Continuar misión hasta último waypoint, luego RTL | 5 s |
| Batería baja (20%) | RTL inmediato | Inmediato |
| Batería crítica (10%) | Aterrizaje forzoso + baliza GPS | Inmediato |
| Fallo de motor (>4 en X8, >2 en Y6) | Aterrizaje controlado, luego RTL | 500 ms |
| Colisión inminente | Frenado + hover + esperar comando | 100 ms |
| Geofence violada | Hover + RTL inverso | 1 s |
| Paracaídas (pérdida total) | Deploy automático < 50 m AGL | 200 ms |

### Environmental Tolerances

| Condición | Límite operativo | Límite de supervivencia |
|-----------|-----------------|------------------------|
| Temperatura | -10°C a 40°C | -20°C a 55°C |
| Viento sostenido | 12 m/s | 18 m/s |
| Ráfagas | 15 m/s | 22 m/s |
| Lluvia | No recomendado | IP65 (lluvia ligera) |
| Polvo | IP5X+ | IP6X (sellado completo) |
| Humedad | 10–90% RH | 5–95% RH sin condensación |

---

## Regulatory Considerations

| País | Autoridad | Regulación principal | BVLOS | Exención minera |
|------|-----------|---------------------|-------|-----------------|
| Argentina | ANAC | RAAC 91 (Drones) | Requiere autorización especial | Zona minera = área restringida, simplifica |
| Chile | DGAC | DAN 151 | Permiso CASLA + análisis de riesgo | Aplica solicitud sectorial MinMinería |
| Perú | MTC | RAP 101 | Autorización previa MTC | Convenio OSINERGMIN facilita |
| Bolivia | DGPSA | RAB 112 (en desarrollo) | No regulado explícitamente | Coordinación con COMIBOL |

Ver [Regulatory Guide](./regulatory.md) para detalles completos.

---

## Autonomy Levels

| Nivel | Descripción | Misión aplicable |
|-------|------------|-----------------|
| **L0** | RC puro — piloto controla todos los ejes | Pruebas, calibración |
| **L1** | Asistencia — hold altitude, return home | Emergencias |
| **L2** | Waypoint — secuencia de puntos GPS | Open-pit Survey |
| **L3** | Waypoint avanzado — cambio de payload dinámico, eventos térmicos | Equipment Inspection |
| **L4** | Autonomía parcial — SLAM/Vislam en túneles | Tunnel Inspection |
| **L5** | Autonomía completa — detección y respuesta a anomalías | Tailings Monitoring |

Roadmap: L0→L2 en v1.0, L3 en v2.0, L4–L5 en v3.0.

---

## Risk Assessment

| Modo de Falla | Probabilidad | Severidad | Mitigación |
|---------------|-------------|-----------|------------|
| Pérdida de empuje por altitud | Media | Alta | Derating factor 0.6, hélices de alto pitch, monitoreo ESC |
| Falla de motor | Media | Alta | Redundancia coaxial, detección automática de falla |
| Falla de GPS en túnel | Alta | Alta | Visual SLAM (ORB-SLAM3/VINS-Fusion), LiDAR odometry |
| Pérdida de enlace de radio | Media | Alta | LoRa backup (915 MHz), misión autónoma store-and-forward |
| Colisión con maquinaria | Media | Alta | Radar de proximidad (Teraranger/TF-Luna), geofence 3D |
| Incendio de batería | Baja | Crítica | Carga supervisada, celda de fuego LiPo, protocolo de emergencia |
| Ingesta de polvo en motores | Alta | Media | Sellos de laberinto + mantenimiento cada 10h vuelo |
| Interferencia EMI con brújula | Alta | Media | Dual GPS con heading (RTK), magnetómetro externo aislado |
| Error en RTK GPS | Media | Alta | Fusión con IMU, detección de divergencia, fallback a SPP |
| Aterrizaje forzoso en terreno irregular | Media | Alta | Paracaídas balístico (Mars Parachutes), airbag |
| Condensación en ópticas | Media | Baja | Calentadores resistivos en lentes, coating hidrofóbico |

---

## Data Flow

```
Sensors → FC (PX4) → Companion Computer (Raspberry Pi 5 / Jetson Orin) → LTE/Radio → Ground Station
           ↓                    ↓                        ↓                          ↓
      Control loops         AI inference           Telemetry / Video          QGroundControl
      Stabilization         SLAM / Mapping         (Compressed H.265)        Mission Planner
      Failsafes              Gas sensing            JSON over MQTT            Real-time 3D map
```

---

## Documentation Index

| Documento | Descripción |
|-----------|-------------|
| [BOM](./bom.md) | Bill of Materials detallado con componentes mineros |
| [Mission Profiles](./mission_profiles.md) | Especificaciones detalladas por tipo de misión |
| [Regulatory Guide](./regulatory.md) | Regulaciones ANAC, DGAC, MTC, DGPSA para minería |

---

## Contributing

See [CONTRIBUTING.md](../../docs/CONTRIBUTING.md) for guidelines.

---
