# Mission Profiles — FPV Miner Drone

> Especificaciones detalladas para cada perfil de misión en minería andina.
> Cada perfil incluye objetivos, payload, restricciones y criterios de éxito.

---

## 1. Tunnel Inspection (Inspección de Túneles)

### Objective
Inspección autónoma de túneles mineros (>3 km de profundidad, sin acceso GPS) para detectar condiciones inseguras, puntos calientes en equipos, y fallas estructurales en sostenimientos (shotcrete, pernos, mallas).

### Payload
| Componente | Especificación | Propósito |
|------------|---------------|-----------|
| Cámara térmica | FLIR Vue Pro R 640×512 | Hot spots en equipos eléctricos y cableado |
| Cámara visual | OV9782 global shutter (1MP) | SLAM visual + inspección visual |
| LiDAR | Ouster OS0-32 (50 m, 90° FOV) | SLAM 3D + mapeo del túnel |
| Iluminación | LED COB 4000 lm + IR 850 nm | Iluminación para cámara visual en oscuridad total |
| Gas sensor | CH4 + CO + NO2 | Atmósfera peligrosa |
| Radar proximidad | Benewake TF-Luna × 4 | Evitación de obstáculos cercanos |

### Flight Profile
| Parámetro | Valor |
|-----------|-------|
| Velocidad crucero | 2–4 m/s (según iluminación / polvo) |
| Altura sobre piso | 3–8 m |
| Distancia a paredes | 2–5 m (según radar) |
| Duración máxima | 20 min (limitado por comunicación en túnel) |
| Alcance máximo | 2.5 km desde entrada del túnel |
| Trayectoria | Zigzag longitudinal + cruces cada 50 m (cobertura 360°) |

### Waypoints
- **Estructura**: Entrada → secciones de 100 m → retorno
- **Navegación**: Visual SLAM (ORB-SLAM3 / VINS-Fusion) + LiDAR odometry
- **Referencia**: Waypoints absolutos desde boca de túnel (coordenadas UTM para inicio)
- **Loop closure**: Cada 5 secciones, revisitar punto conocido para corregir deriva
- **Marcadores**: AprilTag / ArUco en paredes cada 200 m para re-localización

### Data Products
- Nube de puntos 3D del túnel (.las /.ply)
- Ortomosaico térmico de paredes y techo (.tiff)
- Mapa de anomalías térmicas (hot spots >70°C) en coordenadas locales
- Log de gases por sección (CH4, CO, NO2) sobre la línea de tiempo
- Reporte de fisuras en shotcrete (detección por deep learning)
- Video 4K + termografía sincronizada

### Autonomy Level
| Modo | Acción |
|------|--------|
| L0–L1 | Vuelo de entrada (RC) — piloto lleva el dron al inicio del túnel |
| L2–L3 | Waypoints definidos sobre modelo 3D previo o plano del túnel |
| L4 | Autonomía completa — SLAM + waypoints dinámicos según cobertura |
| L5 | Detección autónoma de anomalías + revisión |

### Constraints
| Factor | Límite | Impacto |
|--------|--------|---------|
| Visibilidad | Polvo en suspensión | LiDAR vs cámara — alternar según condición |
| GPS | No disponible | SLAM puro, deriva <1% con loop closure |
| Iluminación | 0–50 lux | IR + LED de alto CRI para cámara |
| Temperatura | 15–35°C (estable, pero con humedad alta) | Lentes pueden empañarse |
| RF | 2.4 GHz no penetra | 915 MHz + cable de fibra óptica para extensión (2 km) |

### Safety Mitigations
- **Deriva de SLAM**: Detección de divergencia → hover + intento de re-localización
- **Pérdida de comunicación**: Store-forward hasta último waypoint → RTL por ruta inversa
- **Colisión**: Parada instantánea si radar <1 m en cualquier dirección
- **Gas peligroso**: Umbrales: CH4 >5000 ppm → aborto inmediato + alarma
- **Fallo de iluminación**: Hover + intentar reinicio → RTL térmico (seguir calor hacia exterior)
- **Agua / lodo**: No volar sobre agua estancada sin depth sensor

### Success Criteria
| Criterio | Métrica |
|----------|---------|
| Cobertura | >95% del túnel mapeado |
| Precisión SLAM | Error de trayectoria <2% |
| Detección de hot spots | Recall >0.90 en anomalías >80°C |
| Tiempo de misión | Completada en <120% del tiempo estimado |
| Sin colisiones | 0 incidentes |

---

## 2. Open-Pit Survey (Relevamiento de Cielo Abierto)

### Objective
Modelado 3D de alta precisión de tajos abiertos para cálculo de volúmenes de material, monitoreo de taludes, detección de grietas, y planificación minera.

### Payload
| Componente | Especificación | Propósito |
|------------|---------------|-----------|
| LiDAR | DJI Zenmuse L2 (450 m, ±2 cm) | Nube de puntos de alta densidad |
| Cámara RGB | Sony A7R IV 61MP (o integrada con L2) | Ortofoto de alta resolución |
| Multiespectral (opcional) | MicaSense RedEdge-P | Mapeo de humedad y tipos de roca |
| RTK GPS | Holybro H-RTK F9P (heading) | Georreferenciación directa |

### Flight Profile
| Parámetro | Valor |
|-----------|-------|
| Velocidad | 8–12 m/s |
| Altura AGL | 80–120 m |
| Overlap frontal | 80% (foto), 50% (LiDAR) |
| Overlap lateral | 65% |
| Duración por batería | 25 min @ 4500 m |
| Área por vuelo | ~40 ha (una batería) |

### Waypoints
- **Estructura**: Grilla de doble pasada (paralela transversal)
- **Resolución**: GSD óptimo 2–3 cm/pixel
- **Elevación**: Waypoints adaptativos al relieve (terrain following con DEM previo)
- **RTK**: Corrección diferencial vía NTRIP desde estación base o red local
- **Precisión**: ±2 cm horizontal, ±5 cm vertical

### Data Products
- Nube de puntos clasificada (.las /.laz) — terreno, vegetación, infraestructura
- Modelo Digital de Terreno (DTM) y Modelo Digital de Superficie (DSM) (.tiff)
- Ortofoto RGB de alta resolución (.tiff)
- Mapa de volúmenes de stockpiles con diferencias corte/relleno
- Mapa de grietas y fisuras en taludes (ML sobre ortofoto + nube de puntos)
- Curvas de nivel cada 2 m (.shp /.dxf)
- Mapa de reflectancia multiespectral (NDVI, NDWI, hierro, arcillas)

### Autonomy Level
| Modo | Acción |
|------|--------|
| L2 | Grilla de waypoints estándar (QGroundControl / Mission Planner) |
| L3 | Terrain following dinámico con DEM onboard |
| L4 | Segmentación autónoma del área según relieve |
| L5 | Detección de cambios respecto a vuelo anterior + alertas |

### Constraints
| Factor | Límite | Impacto |
|--------|--------|---------|
| Viento | <12 m/s sostenido | Derivas >15 m degradan overlap |
| Polvo | Visibilidad >3 km | LiDAR tolerante, cámara no |
| Sol | Ángulo >30° sobre horizonte | Sombras largas degradan ortofoto |
| Altitud aeródromo | 4500 m | Reducción de tiempo de vuelo 30% |
| EMI | Alta cerca de líneas de alta tensión | RTK puede perder fix |

### Safety Mitigations
- **Geofence 3D**: Limitado al perímetro del tajo + 50 m buffer
- **Terrain following**: Sensor de distancia al suelo redundante (LiDAR + sonar)
- **Viento excesivo**: Anemómetro onboard, abortar si >12 m/s sostenido
- **Pérdida de RTK**: Fallback a GPS SPP pero abortar misión (degradación >2 m)
- **Tráfico aéreo**: No operar en zonas con helicópteros de la mina — coordinación previa

### Success Criteria
| Criterio | Métrica |
|----------|---------|
| Precisión horizontal | RMSE <3 cm (GCPs) |
| Densidad de puntos | >50 pts/m² en taludes |
| Volumen de stockpile | Error <2% vs medición topográfica |
| Tiempo de procesamiento | <24 h para 40 ha |
| Cobertura | 100% del área definida |

---

## 3. Equipment Inspection (Inspección de Equipos)

### Objective
Inspección de cercanía a equipos mineros críticos (palas, camiones, chancadores, correas) para detectar fallas incipientes mediante fusión visual + térmica antes de que causen detenciones no programadas.

### Payload
| Componente | Especificación | Propósito |
|------------|---------------|-----------|
| Cámara térmica | FLIR Vue Pro R 640×512 | Rodamientos, frenos, motor eléctrico |
| Cámara visual | Sony IMX477 12MP (global shutter) | Inspección visual de grietas, desgaste |
| LiDAR cercano | Benewake TF02-Pro (40m) | Distancia segura al equipo |
| Iluminación LED | COB 2000 lm | Iluminación de zonas sombrías |
| (Opcional) Ultrasonido | SDT270 (montado en gimbal) | Detección de cavitación / fugas de aire |

### Flight Profile
| Parámetro | Valor |
|-----------|-------|
| Velocidad | 0.5–1.5 m/s (lento, aproximación cuidadosa) |
| Distancia al equipo | 2–6 m |
| Altura relativa | Al nivel del punto de inspección |
| Tiempo por equipo | 3–8 min |
| Órbita | 360° alrededor del equipo a velocidad constante |
| Puntos de interés | 5–15 waypoints por equipo (según complejidad) |

### Waypoints
- **Estructura**: Órbitas concéntricas + puntos de enfoque (zoom)
- **Planificación**: Sobre modelo 3D previo del equipo (BIM o nube de puntos)
- **Cobertura**: 360° con 70% overlap entre fotos térmicas
- **POI**: Puntos de interés predefinidos (rodamientos, motor, sistema hidráulico)
- **Aproximación**: Desde arriba → costados → abajo (evitar jet blast / polvo)

### Data Products
- Ortomosaico térmico del equipo (temperatura por zona)
- Mapa de anomalías térmicas (diferencia >15°C respecto a línea base)
- Video inspección con overlay térmico
- Modelo 3D texturizado del equipo (.obj /.ply)
- Reporte automático de anomalías (ML: grietas, abolladuras, fugas)
- Comparación con inspección anterior (línea base por equipo)
- Log de condición operativa (temperatura normal / alerta / crítica)

### Autonomy Level
| Modo | Acción |
|------|--------|
| L2 | Waypoints manuales sobre modelo 3D cargado previamente |
| L3 | Vuelo autónomo alrededor del equipo con distancia segura mantenida por LiDAR |
| L4 | Detección de desviaciones vs línea base + enfoque automático en anomalías |
| L5 | Decisión autónoma de re-inspección o alerta sin intervención humana |

### Constraints
| Factor | Límite | Impacto |
|--------|--------|---------|
| Distancia mínima | 2 m (seguridad) | No acercarse más aunque haya detalle perdido |
| Viento | <10 m/s | Equipos grandes generan turbulencia |
| Polvo | Alto cerca de palas/camiones | Limpiar lentes entre inspecciones |
| EMI | Muy alto cerca de motores eléctricos grandes | Brújula puede requerir recalibración |
| Temperatura | Superficies hasta 200°C (motores) | No tocar, mantener distancia |

### Safety Mitigations
- **Zona de exclusión**: Buffer 2 m alrededor de personal visible
- **Detección de movimiento**: Evitar hélices si hay personas <5 m
- **Aborto por vibración**: Detectar aumento de vibración (IMU) y retirarse
- **Polvo en lentes**: Vuelo de limpieza (ascenso rápido) si se detecta borrosidad
- **Coordinación**: Nunca volar sobre equipos en movimiento — solo equipos detenidos

### Success Criteria
| Criterio | Métrica |
|----------|---------|
| Cobertura | 100% de los puntos de inspección predefinidos |
| Calidad térmica | Todos los puntos de interés con temperatura válida |
| Detección de fallas | Recall >0.85 en anomalías >15°C |
| Sin incidentes | 0 colisiones con equipos o personal |
| Tiempo por equipo | <10 min desde despliegue a repliegue |

---

## 4. Emergency Supply Transport (Transporte de Suministros)

### Objective
Entrega rápida de suministros críticos (primeros auxilios, repuestos, agua, comunicaciones) en zonas de difícil acceso dentro de la mina, usando navegación autónoma y sistema de liberación preciso.

### Payload
| Componente | Especificación | Propósito |
|------------|---------------|-----------|
| Contenedor | Pelican 1060 (IP67, 4.5L) | Protección de carga |
| Sistema de liberación | Servo HS-645MG + pin electromagnético | Suelta controlada en vuelo estacionario |
| Cámara | Visual + TOF | Confirmación visual de zona de entrega |
| Altímetro de precisión | VL53L1X + baro diferencial | Aterrizaje de precisión ±10 cm |
| Telémetro láser | TF-Luna (8m) | Detección de obstáculos en descenso |

### Flight Profile
| Parámetro | Valor |
|-----------|-------|
| Velocidad crucero | 8–10 m/s (cargado) |
| Velocidad descenso | 0.5 m/s (fase de aproximación) |
| Altura crucero | 30–50 m sobre obstáculos |
| Precisión de entrega | ±2 m horizontal |
| Distancia máxima | 8 km (ida y vuelta) |
| Tiempo total | <30 min (incluye carga y liberación) |

### Waypoints
- **Estructura**: Punto de origen → punto de entrega → retorno a origen
- **Ruta**: Pre-planeada evitando zonas de riesgo (líneas de alta tensión, equipos móviles)
- **Aproximación**: Desde arriba, descenso vertical a <3 m, confirmación visual
- **Liberación**: En hover estable, servo activa pin en <1 s
- **Retorno**: Waypoint directo a origen (RTL optimizado por viento actual)

### Data Products
- Log de entrega: coordenadas, hora, carga entregada
- Foto + video de la zona de entrega (confirmación)
- Reporte de condiciones en zona de entrega (temp, gas, visibilidad)
- Estado del contenedor (sellado, temperatura interna, impacto)

### Autonomy Level
| Modo | Acción |
|------|--------|
| L2 | Waypoints de ida y vuelta, liberación manual desde GCS |
| L3 | Liberación automática en coordenada con confirmación por cámara |
| L4 | Selección autónoma de zona de aterrizaje alternativa si la primaria no es segura |
| L5 | Decisión de retorno sin entregar si condiciones inseguras |

### Constraints
| Factor | Límite | Impacto |
|--------|--------|---------|
| Carga | 5–10 kg según altitud | A 4500 m, máximo 8 kg |
| Viento | <10 m/s para liberación | Carga suspendida actúa como péndulo |
| Visibilidad | >50 m sobre zona de entrega | Confirmación visual requerida |
| Altitud zona entrega | 3000–5000 m | Derating de motor durante ascenso |
| Temperatura carga | Según tipo (fármacos: 2–25°C) | Contenedor aislado térmicamente |

### Safety Mitigations
- **Carga mal asegurada**: Sensor de peso en gancho, abortar si peso errático
- **Péndulo de carga**: Amortiguación activa en hover (PID compensado)
- **Viento en descenso**: Si ráfagas >10 m/s, abortar y regresar con carga
- **Zona no segura**: Confirmación visual + TOF antes de liberar
- **Fallo de liberación**: Segundo servo redundante, si falla → aterrizaje con carga e informar
- **Proximidad de personal**: No liberar si hay personas <10 m del punto de entrega

### Success Criteria
| Criterio | Métrica |
|----------|---------|
| Entrega exitosa | Carga liberada en zona designada |
| Precisión | ±2 m del punto objetivo |
| Integridad de carga | 100% sin daños |
| Tiempo | <120% del estimado |
| Sin incidentes | 0 colisiones, 0 pérdida de control |

---

## 5. Tailings Dam Monitoring (Monitoreo de Diques de Relaves)

### Objective
Monitoreo periódico de presas de relaves para detección temprana de filtraciones, erosión, inestabilidad de taludes, estrés hídrico en vegetación circundante, y cambios estructurales mediante sensores multiespectrales, térmicos y LiDAR.

### Payload
| Componente | Especificación | Propósito |
|------------|---------------|-----------|
| Multiespectral | MicaSense RedEdge-P (5 bandas + RGB) | NDVI, NDWI, estrés vegetal |
| Cámara térmica | FLIR Vue Pro R 640×512 | Filtraciones (agua más caliente/fría) |
| LiDAR | Ouster OS0-32 (50m) | Topografía de presa + detección deformación |
| RTK GPS | Holybro H-RTK F9P | Georreferenciación sub-decimétrica |
| Inclinómetro | (opcional) sensor de desplazamiento en estructura | Comparación de modelos 3D entre vuelos |

### Flight Profile
| Parámetro | Valor |
|-----------|-------|
| Velocidad | 6–10 m/s |
| Altura AGL | 60–100 m (multiespectral), 40–60 m (LiDAR) |
| Overlap | 75% frontal (multiespectral), 50% LiDAR |
| Área por vuelo | 20–50 ha |
| Frecuencia | Semanal (rutina), diaria (eventos de lluvia) |
| Duración | 25 min por batería |

### Waypoints
- **Estructura**: Grilla paralela al talud + órbitas alrededor de la presa
- **Terrain following**: Perfil de elevación adaptado a forma de la presa
- **Zonas críticas**: Puntos de interés fijos (tuberías de decantación, junta de construcción)
- **Repetibilidad**: Waypoints idénticos vuelo a vuelo (change detection)
- **Control**: GCPs permanentes instalados en la presa

### Data Products
- **Serie temporal NDVI/NDWI**: Evolución de vegetación en manto de cobertura
- **Mapa térmico de filtraciones**: Temperatura superficial del agua vs sólidos
- **Nube de puntos diferencial**: Deformación del talud entre vuelos (±5 cm)
- **DTM de alta resolución**: Superficie de la presa con sistema de drenaje visible
- **Mapa de humedad superficial**: Basado en bandas SWIR
- **Reporte de anomalías**: Filtraciones, grietas, erosión, vegetación fuera de parámetro
- **Alertas automáticas**: Si deformación >10 cm o NDVI fuera de rango normal

### Autonomy Level
| Modo | Acción |
|------|--------|
| L3 | Misión semanal completamente autónoma con waypoints predefinidos |
| L4 | Detección de cambios respecto a vuelo anterior + re-inspección de zonas anómalas |
| L5 | Decisión autónoma de aumentar frecuencia de monitoreo si se detectan indicadores de riesgo |

### Constraints
| Factor | Límite | Impacto |
|--------|--------|---------|
| Viento | <10 m/s | Taludes expuestos, turbulencia |
| Sol | Nadir ±2 h para multiespectral | Iluminación consistente entre vuelos — volar misma hora |
| Polvo | Moderado (relave seco) | Limpiar ópticas multiespectral entre vuelos |
| Neblina | Alta en valles | Puede cancelar misión |
| Reflectancia agua | Baja en NIR para NDWI | Ajustar exposición automáticamente |

### Safety Mitigations
- **Geofence**: Área específica de la presa, nunca sobre el embalse (>100 m de orilla)
- **Fallo de batería**: RTL a base segura (nunca caer en relave — contaminación)
- **Condiciones climáticas**: Abortar si visibilidad <3 km o viento >10 m/s
- **Estación base**: GMCP en campo con línea de visión a dron
- **Coordinación**: Notificar a operaciones de la presa antes/periódicamente

### Success Criteria
| Criterio | Métrica |
|----------|---------|
| Precisión deformación | RMSE <5 cm en puntos de control |
| Cobertura | 100% de la superficie definida |
| NDVI útil | Datos sin nubes/bruma en >90% del área |
| Filtraciones detectadas | Recall >0.85 (validado con inspección terrestre) |
| Tiempo de reporte | <48 h desde vuelo a informe final |
| Sin incidentes | 0 colisiones o aterrizajes en zona de relave |

---

## Summary Matrix

| Perfil | Plataforma | Payload Principal | Altura | Velocidad | Autonomía | Duración | Costo/Vuelo |
|--------|-----------|-------------------|--------|-----------|-----------|----------|-------------|
| Tunnel Inspection | Scout Y6 | Térmica + LiDAR + Gas | 3–8 m | 2–4 m/s | L3–L4 | 20 min | Bajo |
| Open-Pit Survey | Heavy-Lift X8 | LiDAR + RGB + RTK | 80–120 m | 8–12 m/s | L2–L3 | 25 min | Medio |
| Equipment Inspection | Scout Y6 | Térmica + Visual | 2–6 m | 0.5–1.5 m/s | L3–L4 | 5 min/eq | Bajo |
| Supply Transport | Heavy-Lift X8 | Payload 5–10 kg | 30–50 m | 8–10 m/s | L3–L4 | 30 min | Alto |
| Tailings Monitoring | Heavy-Lift X8 | Multiespectral + LiDAR + Térmica | 60–100 m | 6–10 m/s | L3–L5 | 25 min | Medio |
