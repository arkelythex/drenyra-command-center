# Arkelythex API - Monitoring Infrastructure

> **Stack**: Prometheus + Grafana  
> **Purpose**: Observability and performance monitoring for Arkelythex API  
> **Status**: ✅ Configured and ready to deploy

---

## 📊 Overview

This directory contains the complete monitoring infrastructure for Arkelythex API:

- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboards
- **Redis Exporter**: Redis metrics

```
monitoring/
├── prometheus/
│   ├── prometheus.yml          # Prometheus configuration
│   └── alerts/
│       └── arkelythex-api.yml     # Alert rules
└── grafana/
    ├── provisioning/
    │   ├── datasources/
    │   │   └── prometheus.yml  # Datasource config
    │   └── dashboards/
    │       └── arkelythex.yml      # Dashboard provisioning
    └── dashboards/
        └── README.md           # Dashboard documentation
```

---

## 🚀 Quick Start

### 1. Start Monitoring Stack

```bash
# Start all services including monitoring
docker-compose up -d

# Check status
docker-compose ps
```

### 2. Access Interfaces

| Service | URL | Credentials |
|---------|-----|-------------|
| **Prometheus** | http://localhost:9090 | No auth |
| **Grafana** | http://localhost:3002 | admin / admin (change on first login) |
| **Arkelythex API Metrics** | http://localhost:3000/metrics | No auth |
| **Redis Exporter** | http://localhost:9121/metrics | No auth |

### 3. Verify Metrics Collection

1. Open Prometheus: http://localhost:9090
2. Go to Status → Targets
3. Verify all targets are "UP":
   - `arkelythex-api` (3000)
   - `redis` (9121)
   - `prometheus` (9090)

### 4. View Dashboards

1. Open Grafana: http://localhost:3002
2. Login with admin/admin
3. Navigate to Dashboards → Arkelythex folder
4. Open available dashboards


### Local live smoke stack

Use the smoke override when you only need to validate API metrics, Prometheus targets, Grafana provisioning, and alert wiring without colliding with a long-running local stack. The smoke stack keeps labels bounded and verifies that high-cardinality fiscal IDs do not leak into Prometheus route labels.

```bash
docker compose --env-file monitoring/observability-smoke.env \
  -f docker-compose.yml \
  -f docker-compose.observability-smoke.yml \
  up -d api prometheus grafana redis-exporter

BASE_URL=http://localhost:3000 \
PROMETHEUS_URL=http://localhost:9090 \
GRAFANA_URL=http://localhost:3002 \
  bash monitoring/test-monitoring.sh

docker compose --env-file monitoring/observability-smoke.env \
  -f docker-compose.yml \
  -f docker-compose.observability-smoke.yml \
  down --remove-orphans
```

Smoke defaults are local-only and live in `monitoring/observability-smoke.env`; do not reuse those credentials outside development.

---

## 📈 Available Metrics

### System Metrics (Auto-instrumented)

```promql
# Request rate
rate(arkelythex_api_http_requests_total[5m])

# Latency (P95)
histogram_quantile(0.95, rate(arkelythex_api_http_request_duration_seconds_bucket[5m]))

# Error rate
rate(arkelythex_api_http_requests_total{status_code=~"5.."}[5m])

# Total requests
arkelythex_api_http_requests_total
```

### Application Metrics (Custom)

#### OCR Service
```promql
# Documents processed
rate(arkelythex_ocr_documents_total[5m])

# Processing time
rate(arkelythex_ocr_processing_seconds_sum[5m]) / 
rate(arkelythex_ocr_processing_seconds_count[5m])

# Success rate
rate(arkelythex_ocr_documents_total{status="success"}[5m]) / 
rate(arkelythex_ocr_documents_total[5m])
```

#### Fraud Detection
```promql
# Predictions
rate(arkelythex_fraud_predictions_total[5m])

# Fraud rate
rate(arkelythex_fraud_predictions_total{prediction="fraud"}[1h]) / 
rate(arkelythex_fraud_predictions_total[1h])

# Average fraud score
rate(arkelythex_fraud_score_sum[5m]) / 
rate(arkelythex_fraud_score_count[5m])
```

#### SIRE Reconciliation
```promql
# Reconciliations
rate(arkelythex_sire_reconciliations_total[5m])

# Records processed
rate(arkelythex_sire_records_processed_total[5m])

# Discrepancy rate
rate(arkelythex_sire_discrepancies_total[5m]) / 
rate(arkelythex_sire_records_processed_total[5m])
```

#### Ledger Integrity
```promql
# Entries added
rate(arkelythex_ledger_entries_total[5m])

# Chain length
arkelythex_ledger_chain_length

# Verification success rate
rate(arkelythex_ledger_verifications_total{status="valid"}[5m]) / 
rate(arkelythex_ledger_verifications_total[5m])
```

#### XML Validation
```promql
# Validations
rate(arkelythex_xml_validations_total[5m])

# Validation time
rate(arkelythex_xml_validation_seconds_sum[5m]) / 
rate(arkelythex_xml_validation_seconds_count[5m])

# Success rate
rate(arkelythex_xml_validations_total{status="valid"}[5m]) / 
rate(arkelythex_xml_validations_total[5m])
```

---

## 🚨 Configured Alerts

| Alert | Severity | Threshold | Description |
|-------|----------|-----------|-------------|
| **HighErrorRate** | Critical | >5% | HTTP 5xx errors |
| **HighLatency** | Warning | P95 >2s | Request latency |
| **HighMemoryUsage** | Warning | >85% | Container memory |
| **OCRHighFailureRate** | Warning | >10% | OCR processing failures |
| **FraudDetectionHighRate** | Info | >30% | Fraud detection rate |
| **SIREHighDiscrepancyRate** | Warning | >20% | SIRE discrepancies |
| **LedgerVerificationFailed** | Critical | Any failure | Ledger integrity |
| **XMLValidationHighFailureRate** | Warning | >15% | XML validation failures |
| **RedisDown** | Critical | Service down | Redis unavailable |
| **ArkelythexApiDown** | Critical | Service down | Arkelythex API unavailable |

### View Active Alerts

- **Prometheus**: http://localhost:9090/alerts
- **Grafana**: Alerting → Alert rules

---

## 🔧 Configuration

### Prometheus

**Scrape Interval**: 15s  
**Retention**: 30 days  
**Storage**: Docker volume `prometheus_data`

Edit configuration:
```bash
vim monitoring/prometheus/prometheus.yml
```

Reload configuration (without restart):
```bash
curl -X POST http://localhost:9090/-/reload
```

### Grafana

**Admin User**: admin  
**Admin Password**: Set via `GRAFANA_PASSWORD` env var (default: admin)  
**Storage**: Docker volume `grafana_data`

Edit datasource:
```bash
vim monitoring/grafana/provisioning/datasources/prometheus.yml
```

### Alert Rules

Edit alert rules:
```bash
vim monitoring/prometheus/alerts/arkelythex-api.yml
```

Validate alert rules:
```bash
docker exec arkelythex-prometheus promtool check rules /etc/prometheus/alerts/arkelythex-api.yml
```

---

## 📊 Creating Dashboards

### Option 1: Grafana UI

1. Open Grafana → Dashboards → New Dashboard
2. Add panels with Prometheus queries
3. Save dashboard
4. Export JSON: Dashboard settings → JSON Model
5. Save to `monitoring/grafana/dashboards/`

### Option 2: JSON File

1. Create JSON file in `monitoring/grafana/dashboards/`
2. Use Prometheus datasource UID: `prometheus`
3. Restart Grafana to auto-provision

### Example Panel Query

```json
{
  "targets": [
    {
      "expr": "rate(arkelythex_api_http_requests_total[5m])",
      "legendFormat": "{{method}} {{handler}}",
      "refId": "A"
    }
  ],
  "title": "Request Rate",
  "type": "graph"
}
```

---

## 🐛 Troubleshooting

### Prometheus not scraping

```bash
# Check Prometheus logs
docker logs arkelythex-prometheus

# Verify targets
curl http://localhost:9090/api/v1/targets

# Test metrics endpoint
curl http://localhost:3000/metrics
```

### Grafana datasource not working

```bash
# Check Grafana logs
docker logs arkelythex-grafana

# Verify Prometheus is reachable from Grafana
docker exec arkelythex-grafana wget -O- http://prometheus:9090/api/v1/status/config
```

### No metrics appearing

```bash
# Verify Arkelythex API is exposing metrics
curl http://localhost:3000/metrics | grep arkelythex

# Check if Prometheus is scraping
curl http://localhost:9090/api/v1/query?query=up{job="arkelythex-api"}
```

### High memory usage

```bash
# Check Prometheus memory
docker stats arkelythex-prometheus

# Reduce retention if needed (in prometheus.yml)
--storage.tsdb.retention.time=15d

# Check Grafana memory
docker stats arkelythex-grafana
```

---

## 📚 Resources

### Documentation
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
- [PromQL Basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)

### Dashboards
- [Grafana Dashboard Gallery](https://grafana.com/grafana/dashboards/)
- [FastAPI Dashboards](https://grafana.com/grafana/dashboards/?search=fastapi)

### Best Practices
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)
- [Grafana Best Practices](https://grafana.com/docs/grafana/latest/best-practices/)

---

## 🔐 Security Considerations

1. **Change default Grafana password** on first login
2. **Restrict access** to monitoring ports in production (use firewall/VPN)
3. **Use HTTPS** for Grafana in production (configure reverse proxy)
4. **Limit retention** to balance storage and compliance needs
5. **Regular backups** of Grafana dashboards and Prometheus data

---

## 📊 Performance Impact

| Component | Memory Limit | CPU Impact | Notes |
|-----------|--------------|------------|-------|
| **Prometheus** | 256MB | <5% | Scraping every 15s |
| **Grafana** | 128MB | <2% | Minimal when not viewing dashboards |
| **Redis Exporter** | 64MB | <1% | Lightweight exporter |
| **Arkelythex API Instrumentation** | +10MB | <1% | Prometheus client overhead |

**Total Overhead**: ~450MB RAM, <10% CPU

---

## 🚀 Next Steps

1. ✅ Monitoring infrastructure configured
2. [ ] Create custom Grafana dashboards
3. [ ] Configure Alertmanager for notifications (email, Slack)
4. [ ] Set up recording rules for complex queries
5. [ ] Implement log aggregation (Loki)
6. [ ] Add distributed tracing (Jaeger/Tempo)

---

> [!NOTE]
> This monitoring setup validates the consolidation metrics (RAM, latency, throughput) in real-time and provides early warning for performance degradation.

---

**Última actualización**: 2026-06-20

*Alineado con la [Filosofía Gentleman](../../docs/meta/gentleman-philosophy.md) de ARKELYTHEX — documentación que prioriza la claridad y el respeto por tu tiempo.*
