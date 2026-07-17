# Matriz de Edge Cases y Mitigación

EdgeTraz Agro está diseñado para operar en condiciones hostiles (campos agrícolas con conectividad nula y clima extremo).

## 1. Conectividad y Sincronización
| Caso de Borde | Impacto | Mitigación en EdgeTraz |
| :--- | :--- | :--- |
| **Corte de internet por > 7 días** | Saturación de almacenamiento local. | Uso de SQLite con compresión de payloads; sistema de rotación de logs críticos; priorización de eventos (Alertas > Telemetría). |
| **Reinicio durante sincronización** | Posible duplicidad de eventos. | Implementación de **Idempotencia** total basada en el `event_id` (ULID) en el servidor central. |
| **Cambio de zona horaria / Drift de reloj** | Desorden cronológico de eventos. | Uso de **ULIDs** (ordenable por tiempo de creación) en lugar de timestamps del sistema únicamente; NTP sync periódico cuando haya señal. |

## 2. Integridad de Datos (Seguridad)
| Caso de Borde | Impacto | Mitigación en EdgeTraz |
| :--- | :--- | :--- |
| **Manipulación física del Gateway** | Inyección de datos falsos. | Almacenamiento de claves privadas en **Enclaves Seguros (TEE)** o hardware protegido; sellado de gabinete con sensor de intrusión registrado como evento. |
| **Ataque de Replay** | Duplicación de firmas válidas. | Verificación de `prev_hash` en cada evento; el servidor rechaza cualquier evento cuyo hash previo no coincida con el último recibido para ese `device_id`. |

## 3. Operación en Campo
| Caso de Borde | Impacto | Mitigación en EdgeTraz |
| :--- | :--- | :--- |
| **Falla de sensor (lectura fuera de rango)** | Falsas alarmas de plagas. | Algoritmos de **Sanitization** en el edge (filtros Kalman o promedios móviles); detección de desconexión de hardware vía Modbus/MQTT. |
| **Batería baja en nodo IoT** | Pérdida de datos en tiempo real. | Modo de **Bajo Consumo** dinámico (ajuste de frecuencia de muestreo según nivel de carga); alertas preventivas de mantenimiento. |

## 4. Auditoría y Cumplimiento
| Caso de Borde | Impacto | Mitigación en EdgeTraz |
| :--- | :--- | :--- |
| **Solicitud de trazabilidad histórica rápida** | Retraso en certificación. | Generación de **Merkle Trees** diarios; permite verificar la presencia de un lote en segundos sin recorrer toda la base de datos. |
| **Discrepancia entre peso en campo vs empaque** | No conformidad en auditoría. | Módulo de **Conciliación Automática** que dispara alertas de desviación si el peso del lote varía más de un umbral definido. |
