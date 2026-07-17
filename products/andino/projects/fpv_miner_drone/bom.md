# Bill of Materials — FPV Miner Drone

> Componentes mineros ruggedizados para operación en altitud >3000 m.
> Precios en USD estimados a 2025–2026. Variación según distributor.

---

## Frame & Structure

| Qty | Part | Especificación | Mining Feature | Price (USD) | Proveedor |
|-----|------|---------------|----------------|-------------|-----------|
| 1 | Marco Heavy-Lift X8 | 960 mm plegable, fibra de carbono 3K + titanio | Hardware Ti (sin corrosión en ambiente ácido) | 680 | Tarot / CNC |
| 1 | Skid / Patas de aterrizaje | Aluminio 7075 anodizado con amortiguación | Altura libre 300 mm para payload debajo | 85 | Custom CNC |
| 1 | Brida de carga | Placa de montaje rápida M6 (ARCA-SWISS compatible) | Cambio rápido de payload en campo | 45 | Custom CNC |
| 4 | Aisladores de vibración | Silent blocks de silicona (30° Shore) | Banda de paso 15–60 Hz, filtrado IMU | 12 | Sorbothane |
| Set | Tornillería | Ti-6Al-4V grado 5 | Resistencia a la corrosión por sulfatos | 35 | McMaster-Carr |

---

## Propulsion

| Qty | Part | Especificación | Mining Feature | Price (USD) | Proveedor |
|-----|------|---------------|----------------|-------------|-----------|
| 8 | Motor | T-Motor U8II KV100 (o MN7005) | Sellos de laberinto + polvo sellado | 140 c/u | T-Motor |
| 8 | ESC | Hobbywing XRotor Pro 80A HV (6S–14S) | Conformal coating IP56 + heatsink externo | 85 c/u | Hobbywing |
| 8 | Hélice | T-Motor 18×6.4 CF (altura >4000 m) | Balanceadas, carbono pre-preg | 35 c/u | T-Motor |
| 4 | Hélice | T-Motor 20×6.6 CF (para carga pesada) | Alto pitch, baja altitud | 42 c/u | T-Motor |
| 4 | Adaptador de hélice | Aluminio 7075 con seguro de doble contratuerca | Vibración en altitud afloja tuercas comunes | 8 c/u | Custom |

---

## Flight Controller & Autopilot

| Qty | Part | Especificación | Mining Feature | Price (USD) | Proveedor |
|-----|------|---------------|----------------|-------------|-----------|
| 1 | FC Principal | Pixhawk 5X (Holybro) + Pixhawk FMUv5X | Doble IMU (BMI088 + ICM-42688) | 280 | Holybro |
| 1 | FC Backup | Pixhawk 4 Mini (cubercopter redundante) | Redundancia en configuración dual-FC | 120 | Holybro |
| 1 | GPS Primario | Holybro H-RTK F9P (ROVER) + Heading | RTK fix en 10 s, heading dual antena | 420 | Holybro |
| 1 | GPS Backup | u-blox ZED-F9P con heli-cal | Antena con blindaje EMI | 180 | Ardusimple |
| 1 | IMU externa | VectorNav VN-100 (opcional) | Para fusión en alta vibración | 650 | VectorNav |
| 2 | Barómetro | MS5611 + BMP390 (redundantes) | Diferentes principios físicos | 25 c/u | TE / Bosch |
| 1 | Airspeed | Pitot SDP33 (diferencial) | Viento cruzado en tajo | 55 | Holybro |
| 1 | Magnetómetro | RM3100 (externo, aislado) | Inmune a EMI vs HMC5883L | 40 | PNI |

---

## Companion Computer

| Qty | Part | Especificación | Mining Feature | Price (USD) | Proveedor |
|-----|------|---------------|----------------|-------------|-----------|
| 1 | Jetson Orin NX 16GB | 100 TOPS AI, 15W | Inferencia YOLO + fusión de sensores en edge | 650 | NVIDIA |
| 1 | Raspberry Pi 5 8GB | Backup / gestor de comunicación | Watchdog del Orin | 80 | Raspberry |
| 1 | SSD NVMe 512GB | Samsung 980 Pro (industrial temp) | Logs, mapas, data products | 75 | Samsung |
| 1 | UPS HAT | Waveshare UPS Hat (18650×2) | Apagado seguro ante pérdida de batería | 45 | Waveshare |
| 1 | Fan activo | Delta AFB0405HJ (5V, 4cm) | Polvo: con filtro de malla 200µm | 12 | Delta |

---

## Mining Payloads

### Cámaras Térmicas

| Qty | Part | Especificación | Price (USD) | Proveedor |
|-----|------|---------------|-------------|-----------|
| 1 | FLIR Vue Pro R | 640×512, -20°C a 350°C, radiométrica | 3500 | Teledyne FLIR |
| 1 | Opción: DJI Zenmuse H20T | 640×512 radiométrica + zoom 20MP + LRF | 7500 | DJI Enterprise |

### Multiespectral

| Qty | Part | Especificación | Price (USD) | Proveedor |
|-----|------|---------------|-------------|-----------|
| 1 | MicaSense RedEdge-P | 5 bandas (475–842 nm) + RGB 51 MP, DLS 2 | 5500 | AgEagle |
| 1 | Panel de calibración | CRP (reflectancia calibrada) | 350 | MicaSense |

### LiDAR

| Qty | Part | Especificación | Price (USD) | Proveedor |
|-----|------|---------------|-------------|-----------|
| 1 | Ouster OS0-32 | 32 canales, 50 m, 90° FOV | 4200 | Ouster |
| 1 | Opción: DJI Zenmuse L2 | 450 m, ±2 cm, IMU 6-axis | 10500 | DJI Enterprise |

### Sensores de Gas

| Qty | Part | Especificación | Price (USD) | Proveedor |
|-----|------|---------------|-------------|-----------|
| 1 | CH4 sensor | Figaro TGS2611 + preamplificador | 45 | Figaro |
| 1 | CO sensor | Figaro TGS5042 (electroquímico) | 55 | Figaro |
| 1 | NO2 sensor | Alphasense NO2-B43F + circuito | 120 | Alphasense |
| 1 | SO2 sensor | Alphasense SO2-B4 + circuito | 130 | Alphasense |
| 1 | PM2.5/10 | Plantower PMS5003 (I2C/UART) | 25 | Plantower |
| 1 | ADC/MUX | ADS1115 16-bit para sensores analógicos | 12 | Adafruit |
| 1 | Bomba de muestreo | Parker Hargraves miniatura (5V) | 95 | Parker |
| 1 | Carcasa IP67 | Pelican 1010 Micro Case (gas module) | 25 | Pelican |

### Carga / Liberación

| Qty | Part | Especificación | Price (USD) | Proveedor |
|-----|------|---------------|-------------|-----------|
| 1 | Servo de liberación | HS-645MG (torque 7.7 kg·cm, metal gear) | 35 | Hitec |
| 1 | Pin electromagnético | 12V, 10 kg holding | 28 | Magnetics |
| 1 | Contenedor sellado | Pelican 1060 Micro Case (IP67, 4.5L) | 45 | Pelican |
| 1 | Bungee net | Cuerda elástica 6mm, 3m | 8 | Local |
| 1 | Quick release ARCA | Placa rápida compatible ARCA-SWISS | 22 | Custom |

---

## Telemetry & Communication

| Qty | Part | Especificación | Mining Feature | Price (USD) | Proveedor |
|-----|------|---------------|----------------|-------------|-----------|
| 1 | Radio primaria | Holybro Telemetry Radio V3 915 MHz (1W) | Banda 915 MHz (mejor penetración en túneles que 2.4 GHz) | 95 | Holybro |
| 1 | Radio backup | RAK WisBlock 4631 (LoRa, 915 MHz) | Mensajería de emergencia, beacon GPS | 45 | RAK Wireless |
| 1 | LTE modem | Quectel EG25-G (CAT4, global) | Backup celular en tajos con cobertura | 65 | Quectel |
| 1 | LTE antenna | PulseLarsen Y410 (multi-banda, IP67) | Exterior aerodinámica | 35 | PulseLarsen |
| 1 | Video TX | DJI O3 Air Unit (1080p, <25 ms latency) | Cámara FPV para piloto | 230 | DJI |
| 1 | Antenna diversity | TrueRC Matchstick (5.8 GHz, 5 dBi) | Para video RX en estación | 35 c/u | TrueRC |
| 1 | Convertidor SIK→MAVLink | Holybro SiK Telemetry Radio V3 | Configuración dual-band | 55 | Holybro |
| 1 | Cable RF RG316 | Doble shield, SMA macho | Blindaje EMI | 12 | Amphenol |

---

## Power System

| Qty | Part | Especificación | Mining Feature | Price (USD) | Proveedor |
|-----|------|---------------|----------------|-------------|-----------|
| 4 | Batería LiPo | Tattu 22000 mAh 12S 45C | Alta capacidad, C-rating real | 580 c/u | Tattu / Gens Ace |
| 1 | Calentador de baterías | Custom silicon heater (120W, 12V) | Pre-calentamiento >10°C antes de armado | 45 | Custom |
| 1 | PDU / Power module | Holybro PM07 (12S, 120A) | Monitoreo independiente de celdas | 75 | Holybro |
| 2 | XT90 AS | Conector anti-chispa | Seguridad en entorno con polvo combustible | 8 c/u | Amass |
| 1 | Step-down 12V | Matek UBEC 12V (5A, filtered) | Aislado, para cámara + calentador | 25 | Matek |
| 1 | Step-down 5V | Matek VBEC 5V (3A, filtered) | Para companion + sensores | 18 | Matek |
| 1 | Switched BEC | Matek PDB-X7 | Distribución con filtro LC + indicadores LED | 55 | Matek |

---

## Safety Components

| Qty | Part | Especificación | Price (USD) | Proveedor |
|-----|------|---------------|-------------|-----------|
| 1 | Paracaídas balístico | Mars Parachutes 2000 g (deploy <50 m AGL) | 280 | Mars Parachutes |
| 1 | Sistema de deploy | Piroprecise + servo HS-5085MG | 85 | Custom |
| 1 | Airbag (experimental) | Custom CO2 inflatable (underbelly) | 120 | Custom |
| 1 | Buzzer | Alexa Mega (120 dB, IP67) | Localización post-crash | 12 | Adafruit |
| 1 | Beacon LED | Cree XHP70.2 (4000 lm, estroboscópico) | Visibilidad en mina (norma minería) | 35 | Cree |
| 2 | Tira LED navegación | WS2812B en carcasa IP67 (rojo/verde) | Identificación de orientación | 15 c/u | Adafruit |
| 1 | Módulo baliza GPS | Spot Trace + BT | Emergencia si se pierde link | 150 | Spot |
| 1 | Fusible térmico | Bourns AHEF100 (PTC 100A) | Protección sobrecorriente batería | 3 | Bourns |
| 1 | Sensor de humo / fuego | MQ-2 + termistor en compartimento batería | Detección de incendio LiPo | 18 | Custom |

---

## Sensors & Navigation

| Qty | Part | Especificación | Mining Feature | Price (USD) | Proveedor |
|-----|------|---------------|----------------|-------------|-----------|
| 2 | Radar de proximidad | Benewake TF-Luna (8m, I2C/UART) | Detección de obstáculos cercanos | 25 c/u | Benewake |
| 1 | LiDAR de proximidad | RPLIDAR S2L (40m, 360°) | SLAM en túneles | 480 | Slamtec |
| 1 | Cámara stereo | Intel RealSense D455 (RGBD, 20m) | Depth para SLAM + evitación | 350 | Intel |
| 1 | Cámara visual (SLAM) | OV9782 global shutter (1MP, USB) | Visual-inertial odometry (low light) | 65 | ArduCam |
| 1 | TOF multisensor | VL53L1X ×4 (I2C multiplexado) | Aterrizaje de precisión + detección suelo | 35 | ST / Pololu |
| 1 | IMU auxiliar | ICM-20948 (9-DOF) | Respaldo para VIO | 22 | TDK |
| 1 | Sensor de corriente | ACS758 (100A, 5V) | Monitoreo independiente + datalog | 15 | Allegro |

---

## Ground Station

| Qty | Part | Especificación | Price (USD) | Proveedor |
|-----|------|---------------|-------------|-----------|
| 1 | Tablet rugged | Samsung Galaxy Tab Active5 (IP68, MIL-STD-810H) | 650 | Samsung |
| 1 | Laptop (opcional) | Dell Latitude 5430 Rugged | 2800 | Dell |
| 1 | Antena direccional 915 MHz | Yagi 9 dBi (conector N) | 85 | L-Com |
| 1 | Antena omnidireccional 915 MHz | 8 dBi omnigain | 45 | L-Com |
| 1 | Receptor LTE | MikroTik SXTsq 5 ac (5 GHz) | 65 | MikroTik |
| 1 | Hub de carga LiPo | HobbyKing Quattro 4×6A | 95 | HobbyKing |
| 1 | Case de transporte | Pelican 1630 (con foam precortado) | 280 | Pelican |

---

## Tools & Maintenance

| Qty | Part | Especificación | Price (USD) | Proveedor |
|-----|------|---------------|-------------|-----------|
| Set | Llaves hex Ti | Bondhus balldriver, 1.5–8 mm | 25 | Bondhus |
| 1 | Torquímetro | Wiha 79201 (0.6–6 Nm) | 85 | Wiha |
| 1 | Multímetro | Fluke 179 True RMS (CAT III) | 280 | Fluke |
| 1 | Cargador LiPo | ToolkitRC M8S (400W, 2CH) | 145 | ToolkitRC |
| 1 | Power supply | HobbyStar 600W 24V | 65 | HobbyStar |
| 1 | Medidor de empuje | RC Bench (40 kg, USB datalog) | 180 | RC Bench |
| 1 | Kit de limpieza | Alcohol isopropílico + cepillo antiestático + aire comprimido | 35 | Local |
| 1 | Lubricante | WD-40 Specialist PTFE (polvo no atrae) | 12 | WD-40 |
| 1 | Conformal coating | MG Chemicals 422B (silicona, 50 ml) | 22 | MG Chemicals |

---

## Consumables (por 100 h de vuelo)

| Qty | Part | Especificación | Price (USD) |
|-----|------|---------------|-------------|
| 8 | Hélice de repuesto | Igual a hélices primarias | 280 |
| 4 | Batería LiPo | Tattu 22000 mAh 12S | 2320 |
| 2 | Filtro de polvo HEPA | Repuesto para ventilación | 25 |
| 1 | Kit de juntas tóricas | Para sellos IP | 15 |
| 2 | Pasta térmica | Arctic MX-6 (para ESC + companion) | 20 |
| 10 | Conector XT90 AS (par) | Repuesto por desgaste | 80 |

---

## Cost Summary

| Categoría | Costo Total (USD) |
|-----------|------------------|
| Frame & Structure | 857 |
| Propulsion | 2280 |
| Flight Controller & Autopilot | 1815 |
| Companion Computer | 862 |
| Mining Payloads (configurable) | 4335–17600 |
| Telemetry & Communication | 660 |
| Power System | 1428 |
| Safety Components | 743 |
| Sensors & Navigation | 1042 |
| Ground Station | 4020 |
| Tools & Maintenance | 1007 |
| **Total Base System** | **17049** |
| **Total con payloads completos** | **~35000** |

---

*Nota: Los precios son estimaciones para presupuesto. Solicitar cotización actualizada a distribuidores oficiales. El sistema completo puede subcontratarse por proyecto con costo reducido si se alquilan payloads especializados (LiDAR, multiespectral) en lugar de comprarlos.*
