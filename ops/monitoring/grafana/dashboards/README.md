# Arkelythex API - Grafana Dashboards

This directory contains Grafana dashboard definitions for Arkelythex API monitoring.

## Available Dashboards

### 1. Arkelythex API Overview (`overview.json`)
- Request rate and throughput
- Latency (P50, P95, P99)
- Error rates (4xx, 5xx)
- Memory and CPU usage
- Active connections

### 2. Services Performance (`services.json`)
- OCR processing metrics
- Fraud detection statistics
- SIRE reconciliation performance
- Ledger chain integrity
- XML validation metrics

### 3. Infrastructure (`infrastructure.json`)
- Redis metrics (connections, hit rate, commands/s)
- Database performance
- Container resource usage

## Dashboard Import

Dashboards are automatically provisioned when Grafana starts via the configuration in:
`monitoring/grafana/provisioning/dashboards/arkelythex.yml`

### Manual Import

If you need to manually import a dashboard:

1. Open Grafana at http://localhost:3002
2. Login with admin credentials
3. Navigate to Dashboards → Import
4. Upload the JSON file or paste the JSON content
5. Select "Prometheus" as the datasource

## Creating Custom Dashboards

To create a new dashboard:

1. Design it in the Grafana UI
2. Export as JSON (Dashboard settings → JSON Model)
3. Save to this directory
4. Restart Grafana container to auto-provision

## Dashboard Variables

All dashboards support the following variables:

- `$interval`: Time interval for aggregations (auto)
- `$__rate_interval`: Rate interval (auto)

## Useful Queries

### Request Rate
```promql
rate(http_requests_total[5m])
```

### P95 Latency
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Error Rate
```promql
rate(http_requests_total{status=~"5.."}[5m])
```

### OCR Success Rate
```promql
rate(arkelythex_ocr_documents_total{status="success"}[5m]) / 
rate(arkelythex_ocr_documents_total[5m])
```

### Memory Usage
```promql
container_memory_usage_bytes{container="arkelythex-api"} / 1024 / 1024
```

## Alert Integration

Alerts defined in `monitoring/prometheus/alerts/arkelythex-api.yml` are automatically displayed in Grafana's Alerting section.

## Troubleshooting

### Dashboards not loading
- Check Grafana logs: `docker logs arkelythex-grafana`
- Verify provisioning config: `monitoring/grafana/provisioning/dashboards/arkelythex.yml`
- Ensure JSON files are valid

### No data in panels
- Verify Prometheus is scraping: http://localhost:9090/targets
- Check datasource connection in Grafana
- Verify metric names match in queries

### Performance issues
- Reduce dashboard refresh rate
- Limit time range
- Optimize queries with recording rules

## Resources

- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
- [Prometheus Query Examples](https://prometheus.io/docs/prometheus/latest/querying/examples/)
- [Dashboard Best Practices](https://grafana.com/docs/grafana/latest/best-practices/)

---

**Última actualización**: 2026-06-20

*Alineado con la [Filosofía Gentleman](../../../docs/meta/gentleman-philosophy.md) de ARKELYTHEX — documentación que reduce carga cognitiva y enseña con calidez.*
