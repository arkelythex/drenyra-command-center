#include <Arduino.h>

/**
 * Flight Controller Companion
 *
 * Lee datos de la IMU y los envía por serial al companion computer (RPi/Jetson).
 * Protocolo: JSON sobre UART a 115200 baud.
 */

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);

  // TODO: inicializar IMU (MPU6050 o BMI088)
  // TODO: inicializar barómetro (BMP280)

  digitalWrite(LED_BUILTIN, HIGH);
  Serial.println("{\"type\":\"status\",\"msg\":\"Flight controller online\"}");
}

void loop() {
  // TODO: leer IMU
  // TODO: leer barómetro
  // TODO: construir JSON con telemetría
  // TODO: enviar por Serial

  // Placeholder
  static unsigned long last = 0;
  if (millis() - last > 1000) {
    Serial.println("{\"type\":\"telemetry\",\"roll\":0.0,\"pitch\":0.0,\"yaw\":0.0}");
    last = millis();
  }

  // TODO: recibir comandos del companion (setpoint, arm, mode)
}
