#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# flash_firmware.sh — Flashear flight controller o ESP32
# ============================================================
# Uso: ./flash_firmware.sh flight_controller
#      ./flash_firmware.sh esp32_telemetry
# ============================================================

TARGET="${1:-}"

if [ -z "$TARGET" ]; then
    echo "Uso: $0 {flight_controller|esp32_telemetry}"
    exit 1
fi

FIRMWARE_DIR="$(dirname "$0")/../firmware/$TARGET"

if [ ! -d "$FIRMWARE_DIR" ]; then
    echo "Error: no se encontró el directorio $FIRMWARE_DIR"
    exit 1
fi

echo "Flasheando $TARGET..."
cd "$FIRMWARE_DIR"
pio run --target upload
echo "✅ $TARGET flasheado correctamente"
