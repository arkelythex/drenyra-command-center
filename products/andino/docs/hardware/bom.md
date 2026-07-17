# AndinoDroneLab — Bill of Materials

> **Project**: Autonomous drone platform for high-altitude operations (Andes mountains)
> **Architecture**: ROS 2 + PX4 + NVIDIA Jetson + T-Motor components
> **Document version**: 1.0

---

## Tier 1: Andino Heavy-Lift X8 (Flagship)

Coaxial X8 octocopter. 810 mm frame. 12S. Designed for 5–6 kg payload. Intended for heavy-payload survey, SAR, and scientific instrumentation missions above 4,000 m.

### Airframe & Propulsion

| Component | Model | Qty | Unit Price (USD) | Total (USD) | Unit Weight (g) | Notes |
|---|---|---|---|---|---|---|
| Frame | Tarot TL8X000 810 mm X8 (3K CF + CNC 6061) | 1 | $450 | $450 | 2,100 | Folding arms, retractable landing gear |
| Motor | T-Motor MN501S KV240 | 8 | $200 | $1,600 | 300 | 4–8 kg thrust per motor, 12S capable |
| Propeller | T-Motor 20 × 6.0 CF (CW + CCW) | 8 | $50 | $400 | 80 | Carbon fibre, matched pair |
| ESC | T-Motor Alpha 60A HV (12S) | 8 | $150 | $1,200 | 100 | 60 A continuous, 12S, BLHeli_32 |
| Propeller hardware | M8 nylon lock nuts + washers | 16 | $2 | $32 | — | Spare set included |

### Flight Controller & Navigation

| Component | Model | Qty | Unit Price (USD) | Total (USD) | Unit Weight (g) | Notes |
|---|---|---|---|---|---|---|
| Flight controller | Holybro Pixhawk 6X | 1 | $450 | $450 | 85 | Triple IMU (ICM-20649, ICM-42688, ICM-20948), dual barometer, IMU heater |
| GNSS receiver | Holybro H-RTK F9P (Helical) | 1 | $350 | $350 | 50 | RTK capable, helical antenna for multipath rejection |
| Compass | Holybro RM3100 (external) | 1 | $40 | $40 | 10 | External magnetometer, I²C |
| Airspeed sensor | Holybro DLVR Airspeed | 1 | $40 | $40 | 10 | I²C, dual port |

### Onboard Compute & Perception

| Component | Model | Qty | Unit Price (USD) | Total (USD) | Unit Weight (g) | Notes |
|---|---|---|---|---|---|---|
| Main computer | NVIDIA Jetson AGX Orin 64 GB | 1 | $1,600 | $1,600 | 500 | 275 TOPS, 12-core Cortex-A78AE, 64 GB LPDDR5 |
| Carrier board | NVIDIA Jetson AGX Orin Developer Kit | 1 | $400 | $400 | 200 | USB-C, GigE, HDMI, M.2 Key M + Key E |
| NVMe SSD | Samsung 980 Pro 2 TB (M.2 NVMe) | 1 | $200 | $200 | 10 | PCIe 4.0 for ROS 2 bag recording |
| Primary LiDAR | Ouster OS0-128 Rev D | 1 | $3,500 | $3,500 | 800 | 128 channels, 90° vertical FOV, 0–50 m range, integrated IMU |
| Stereo camera | Stereolabs ZED X (GMSL2) | 2 | $400 | $800 | 100 | Stereo depth, GMSL2 interface, 4K |
| Thermal camera | InfiRay Mate ASR M600 | 1 | $2,500 | $2,500 | 300 | 640 × 512 thermal, 30 mK sensitivity *(optional)* |
| Gimbal | Gremsy VIO F3 | 1 | $2,500 | $2,500 | 800 | 3-axis stabilised, 0.02° pointing accuracy *(optional)* |

### Power System

| Component | Model | Qty | Unit Price (USD) | Total (USD) | Unit Weight (g) | Notes |
|---|---|---|---|---|---|---|
| Battery | Tattu 12S 28 000 mAh 25C LiHV | 2 | $600 | $1,200 | 2,250 | 44.4 V, 1.24 kWh per pack, XT90 connector |
| Power module | Holybro PM07 (12S) | 1 | $80 | $80 | 40 | 12S, 5.1 V/5 A + 13.2 V/5 A BEC, current sensing |
| Power distribution | Custom 12S PDB + capacitor bank | 1 | $120 | $120 | 150 | Copper bus bars, 1000 µF capacitor bank |
| Battery monitor | Holybro SIK Telemetry Radio V3 + MAVLink | 1 | $30 | $30 | 10 | Voltage/current logging via MAVLink |

### Communications

| Component | Model | Qty | Unit Price (USD) | Total (USD) | Unit Weight (g) | Notes |
|---|---|---|---|---|---|---|
| Telemetry radio | RFD900x (900 MHz) | 2 | $150 | $300 | 20 | 100 km range, MAVLink v2, AES-256 encryption |
| Cellular modem | Quectel RM502Q-AE (M.2) | 1 | $250 | $250 | 15 | 5G NR sub-6 GHz, M.2 Key B |
| Cellular antenna | TAOGLAS 5G/4G multiband (M.2) | 2 | $20 | $40 | 10 | SMA, adhesive mount |
| RC receiver | Radiomaster RM88-ELRS | 1 | $40 | $40 | 10 | ExpressLRS 2.4 GHz, CRSF protocol |
| RC transmitter | Radiomaster TX16S (ELRS) | 1 | $200 | $200 | 650 | EdgeTX, 16 channels, multi-protocol module bay |

### Safety & Payload

| Component | Model | Qty | Unit Price (USD) | Total (USD) | Unit Weight (g) | Notes |
|---|---|---|---|---|---|---|
| Parachute system | ParaZero Drone Safety Parachute (custom) | 1 | $600 | $600 | 500 | Spring-deployed, pyrotechnic cutter |
| Buzzer | Holybro STM32F103 Buzzer | 1 | $15 | $15 | 10 | Arming/disarm tone, failsafe alarm |
| LED module | Holybro RGB LED (WS2812) | 2 | $10 | $20 | 5 | Status indicator, orientation |
| Safety switch | Holybro Safety Switch | 1 | $10 | $10 | 5 | Arm/disarm |

---

### Tier 1 Summary

| Item | Subtotal |
|---|---|
| Airframe & Propulsion | $3,682 |
| Flight Controller & Navigation | $880 |
| Onboard Compute & Perception | $9,000 |
| Power System | $1,430 |
| Communications | $830 |
| Safety & Payload | $645 |
| **Total (with all options)** | **$16,467** |
| **Total (without optional thermal/gimbal)** | **$11,467** |
| Estimated dry weight (without battery) | ~9 700 g |
| Estimated AUW (with 2× battery) | ~14 200 g |

---

## Tier 2: Andino Scout Y6 (Development Platform)

Y6 coaxial hexacopter. 650 mm frame. 6S. Designed for 2–3 kg payload. Primary platform for algorithm development, sensor prototyping, and pilot training.

### Airframe & Propulsion

| Component | Model | Qty | Unit Price (USD) | Total (USD) | Unit Weight (g) | Notes |
|---|---|---|---|---|---|---|
| Frame | Tarot FY650 Y6 (3K CF) | 1 | $180 | $180 | 1,200 | Y6 coaxial, folding arms |
| Motor | T-Motor MN4116 KV340 | 6 | $85 | $510 | 160 | 2.5–5 kg thrust per motor, 6S |
| Propeller | T-Motor 16 × 5.4 CF (CW + CCW) | 6 | $25 | $150 | 50 | Carbon fibre |
| ESC | T-Motor Alpha 40A (6S) | 6 | $60 | $360 | 50 | 40 A continuous, BLHeli_32 |
| Propeller hardware | M6 nylon lock nuts + washers | 12 | $1.50 | $18 | — | Spare set included |

### Flight Controller & Navigation

| Component | Model | Qty | Unit Price (USD) | Total (USD) | Unit Weight (g) | Notes |
|---|---|---|---|---|---|---|
| Flight controller | Holybro Pixhawk 6C | 1 | $200 | $200 | 50 | Dual IMU (ICM-42688, ICM-20948), barometer |
| GNSS receiver — rover | Holybro H-RTK F9P | 1 | $250 | $250 | 35 | RTK rover, moving base |
| GNSS receiver — base | Holybro H-RTK F9P | 1 | $250 | $250 | 35 | RTK base station, static |
| Compass | Holybro RM3100 (external) | 1 | $40 | $40 | 10 | External magnetometer |

### Onboard Compute & Perception

| Component | Model | Qty | Unit Price (USD) | Total (USD) | Unit Weight (g) | Notes |
|---|---|---|---|---|---|---|
| Main computer | NVIDIA Jetson Orin NX 16 GB | 1 | $800 | $800 | 345 | 157 TOPS, 8-core Cortex-A78AE, 16 GB LPDDR5 |
| Carrier board | NVIDIA Jetson Orin NX Developer Carrier | 1 | $250 | $250 | 100 | USB-C, GigE, HDMI, M.2 Key M + Key E |
| NVMe SSD | Samsung 980 Pro 1 TB (M.2 NVMe) | 1 | $130 | $130 | 8 | PCIe 4.0 |
| Mid-range LiDAR | Livox Mid-360 | 1 | $1,200 | $1,200 | 500 | 360° × 59° FOV, 0–40 m range, IP67 |
| Depth camera | Luxonis OAK-D Pro | 2 | $250 | $500 | 50 | Stereo depth + IMU + IR, USB 3.0 |

### Power System

| Component | Model | Qty | Unit Price (USD) | Total (USD) | Unit Weight (g) | Notes |
|---|---|---|---|---|---|---|
| Battery | Tattu 6S 22 000 mAh 25C LiHV | 2 | $250 | $500 | 1,500 | 22.2 V, 488 Wh per pack |
| Power module | Holybro PM03 (6S) | 1 | $40 | $40 | 20 | 6S, 5.3 V/3 A BEC |
| Power distribution | Custom 6S PDB + capacitor bank | 1 | $60 | $60 | 100 | Copper bus bars |
| Battery monitor | Holybro SIK Telemetry Radio V3 + MAVLink | 1 | $30 | $30 | 10 | |

### Communications

| Component | Model | Qty | Unit Price (USD) | Total (USD) | Unit Weight (g) | Notes |
|---|---|---|---|---|---|---|
| Telemetry radio | RFD900x (900 MHz) | 2 | $150 | $300 | 20 | Interchangeable with Tier 1 |
| RC receiver | Radiomaster RM88-ELRS | 1 | $40 | $40 | 10 | ExpressLRS 2.4 GHz |
| Wi-Fi adapter | Intel AX210 (M.2 Key E) | 1 | $30 | $30 | 5 | Wi-Fi 6E, Bluetooth 5.3 |

### Safety

| Component | Model | Qty | Unit Price (USD) | Total (USD) | Unit Weight (g) | Notes |
|---|---|---|---|---|---|---|
| Buzzer | Holybro STM32F103 Buzzer | 1 | $15 | $15 | 10 | |
| LED module | Holybro RGB LED (WS2812) | 2 | $10 | $20 | 5 | |
| Safety switch | Holybro Safety Switch | 1 | $10 | $10 | 5 | |

---

### Tier 2 Summary

| Item | Subtotal |
|---|---|
| Airframe & Propulsion | $1,218 |
| Flight Controller & Navigation | $740 |
| Onboard Compute & Perception | $2,880 |
| Power System | $630 |
| Communications | $370 |
| Safety | $45 |
| **Total** | **$5,883** |
| Estimated dry weight (without battery) | ~3 870 g |
| Estimated AUW (with 2× battery) | ~6 870 g |

---

## Ground Support Equipment

### Workbench & Power

| Item | Model / Description | Price (USD) | Notes |
|---|---|---|---|
| Bench power supply | RD6018 60 V / 18 A | $200 | Programmable, CC/CV |
| Soldering station | TS-100 (portable) or Hakko FX-951 | $100–$350 | Portable + bench options |
| Hot-air rework station | Quick 861DW | $200 | For ESC/carrier board rework |
| Multimeter | Fluke 17B+ | $150 | Category III, 600 V |
| Oscilloscope | Rigol DS1054Z (upgradeable to 100 MHz) | $400 | 4-channel, for ESC/debug |
| LiPo charger | Hota D6 Duo Pro | $150 | Dual channel, 500 W, AC/DC |
| Parallel charging board | MPA Matrix Parallel Board (XT90) | $60 | For 12S packs |
| LiPo voltage alarm | HobbyKing V3 LiPo Alarm | $10 | Per battery |
| LiPo safety bag | LiPo Guard Bag (large) | $20 | Fire-resistant storage |
| ESD mat + wrist strap | 3M ESD mat kit (60 × 90 cm) | $50 | |

### Tools & Kits

| Item | Model / Description | Price (USD) | Notes |
|---|---|---|---|
| Tool kit | iFixit Pro Tech Toolkit | $70 | 64 bits, magnetic mat |
| Hex driver set | Wiha 76004 (1.5–6 mm) | $60 | Precision hex |
| Torque wrench | Fat Wrench (adjustable, 0.5–18 kgf·cm) | $40 | Prop / motor bolt tightening |
| Propeller balancer | Top Flite Magnetic Prop Balancer | $30 | Essential for CF props |
| Crimper kit | IWISS SN-28B + Dupont/Molex pin set | $25 | For servo/ESC connectors |
| Wire stripper | Knipex 12 62 180 | $40 | Self-adjusting |
| Heat gun | Weller 6966C | $50 | 2-speed, 600/700/800 °F |
| Digital calliper | Mitutoyo 500-196-30 | $100 | 150 mm, 0.01 mm accuracy |
| Inspection camera | Teslong MS450 (borescope) | $60 | USB, 5 MP, 7.5 mm dia. |

### Computing & Network

| Item | Model / Description | Price (USD) | Notes |
|---|---|---|---|
| Development laptop | Dell Precision 7780 (i9-13950HX, 64 GB, RTX 5000 Ada) | $4,000 | ROS 2 + Gazebo + CUDA dev |
| Ground station display | GEEKEE ER60 (HDMI, 800 cd/m², 19 V DC) | $150 | Sunlight-readable for field ops |
| Network switch | Ubiquiti USW-Flex-Mini | $50 | 5-port, PoE, field-deployable |
| USB hub | Anker PowerExpand 8-in-1 USB-C Hub | $35 | Ethernet, HDMI, USB 3.0 |
| SSD for data offload | Samsung T7 Shield 2 TB | $200 | Rugged, USB 3.2 |

---

## Spare Parts

### Tier 1 Spares

| Component | Qty (sets) | Price / Set (USD) | Total (USD) | Notes |
|---|---|---|---|---|
| Propeller set (4 × CW + 4 × CCW) | 2 | $250 | $500 | Field spares |
| Motor MN501S | 2 | $200 | $400 | Critical spare |
| ESC Alpha 60A HV | 2 | $150 | $300 | Critical spare |
| XT90 connector (pair) | 10 | $4 | $40 | For 12S |
| Battery strap (velcro, 30 × 500 mm) | 8 | $5 | $40 | |
| M8 prop nut set (10 nuts + washers) | 2 | $5 | $10 | |

### Tier 2 Spares

| Component | Qty (sets) | Price / Set (USD) | Total (USD) | Notes |
|---|---|---|---|---|
| Propeller set (3 × CW + 3 × CCW) | 2 | $125 | $250 | Field spares |
| Motor MN4116 | 2 | $85 | $170 | Critical spare |
| ESC Alpha 40A | 2 | $60 | $120 | Critical spare |
| XT60 connector (pair) | 10 | $3 | $30 | For 6S |
| Battery strap (velcro, 20 × 400 mm) | 6 | $4 | $24 | |
| M6 prop nut set (10 nuts + washers) | 2 | $4 | $8 | |

---

## Grand Total Summary

| Category | Tier 1 (USD) | Tier 2 (USD) | Common (USD) | Total (USD) |
|---|---|---|---|---|
| Airframe & Propulsion | $3,682 | $1,218 | — | $4,900 |
| Flight Controller & Navigation | $880 | $740 | — | $1,620 |
| Onboard Compute & Perception | $9,000 | $2,880 | — | $11,880 |
| Power System | $1,430 | $630 | — | $2,060 |
| Communications | $830 | $370 | — | $1,200 |
| Safety & Payload | $645 | $45 | — | $690 |
| Ground Support | — | — | $6,170 | $6,170 |
| Spares | $1,290 | $602 | — | $1,892 |
| **Grand Total** | **$17,757** | **$6,485** | **$6,170** | **$30,412** |

> **Tier 1 total without options (thermal, gimbal):** $12,757
> **Combined programme cost (both tiers, all options):** ~$30 400
> **Combined programme cost (both tiers, without optional items):** ~$24 500

---

## Charging & Field Infrastructure

| Item | Model | Price (USD) | Notes |
|---|---|---|---|
| DC generator | Honda EU2200i (220 V) | $1,100 | 1.8 kW, inverter, quiet |
| Deep-cycle battery (field power) | Renogy 100 Ah AGM | $200 | Buffer + 12 V for ground station |
| Charging station | Dual Hota D6 Duo Pro + parallel boards | $300 | Charge both tiers simultaneously |
| Power inverter | Renogy 1000 W Pure Sine | $200 | 12 V → 220 V for laptop/chargers |
| Weather station | Ambient Weather WS-2902C | $150 | Wind, temp, pressure for go/no-go |
| Field case | Pelican 1620 (with foam) | $300 | For Tier 2 transport |

> **Total field infrastructure:** ~$2 250 (optional, per deployment site)

---

## Revision History

| Date | Version | Changes | Author |
|---|---|---|---|
| 2026-06-21 | 1.0 | Initial BOM — both tiers, ground support, spares | AndinoDroneLab |
