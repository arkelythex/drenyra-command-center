#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoJson.h>

/**
 * ESP32 Telemetry Bridge
 *
 * Recibe datos del flight controller por UART y los reenvía por WiFi (TCP/UDP)
 * al companion computer. También puede recibir comandos y reenviarlos al FC.
 */

// Config --- WARNING: no committear credenciales reales
const char* SSID = "ANDINO_DRONE_NET";
const char* PASS = "drone_pass_123";
const uint16_t PORT = 8888;

WiFiServer server(PORT);

void setup() {
  Serial.begin(115200);  // UART con flight controller
  Serial2.begin(115200); // debug

  WiFi.begin(SSID, PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial2.print(".");
  }

  server.begin();
  Serial2.println("\nESP32 Telemetry Bridge online");
  Serial2.printf("IP: %s\n", WiFi.localIP().toString().c_str());
}

void loop() {
  WiFiClient client = server.available();

  // Forward: FC UART -> WiFi clients
  if (Serial.available()) {
    String line = Serial.readStringUntil('\n');
    if (client && client.connected()) {
      client.println(line);
    }
  }

  // Forward: WiFi client -> FC UART
  if (client && client.available()) {
    String cmd = client.readStringUntil('\n');
    Serial.println(cmd);
  }

  // TODO: heartbeat, reconnect, watchdog
}
