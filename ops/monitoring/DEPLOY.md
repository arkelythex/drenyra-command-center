# 🚀 Despliegue del Sistema de Monitoreo

> **Tiempo estimado**: 15 minutos  
> **Estado**: ✅ Listo para desplegar

---

## 📋 Pre-requisitos

- ✅ Docker y Docker Compose instalados
- ✅ Bun instalado (monorepo Drenyra)
- ✅ Repo clonado en `arkelythex/drenyra`

---

## 🎯 Paso a Paso

### 1. Instalar dependencias del monorepo (2 min)

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/drenyra
bun install --frozen-lockfile
```

---

### 2. Configurar Variables de Entorno (1 min)

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/drenyra

# Copiar archivo de ejemplo (raíz o apps/api según tu stack local)
cp .env.example .env

# Editar si es necesario (opcional)
# nano .env
```

**Variables importantes**:
- `ENABLE_METRICS=true` - Habilita métricas de Prometheus
- `GRAFANA_PASSWORD=admin` - Contraseña de Grafana (cambiar en producción)

---

### 3. Levantar el Stack Completo (5 min)

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/drenyra

# Levantar todos los servicios
docker-compose up -d

# Ver logs en tiempo real (opcional)
docker-compose logs -f
```

**Servicios que se levantarán** (nombres en `docker-compose.yml`):
- ✅ `arkelythex-api` - API principal (puerto 3000)
- ✅ `prometheus` - Recolección de métricas (puerto 9090)
- ✅ `grafana` - Visualización (puerto 3002)
- ✅ `redis` - Cache (puerto 6379)
- ✅ `redis-exporter` - Métricas de Redis (puerto 9121)

---

### 4. Verificar que Todo Está Corriendo (2 min)

```bash
# Verificar estado de contenedores
docker-compose ps

# Deberías ver todos con status "Up"
```

**Salida esperada**:
```
NAME                    STATUS
arkelythex-api             Up (healthy)
arkelythex-grafana          Up
arkelythex-prometheus       Up
arkelythex-redis            Up (healthy)
arkelythex-redis-exporter   Up
```

**Si algún servicio no está "Up"**:
```bash
# Ver logs del servicio problemático
docker-compose logs [nombre-servicio]

# Ejemplo: docker-compose logs arkelythex-api
```

---

### 5. Probar el Endpoint de Métricas (2 min)

```bash
# Verificar que Arkelythex API está respondiendo
curl http://localhost:8000/health

# Verificar endpoint de métricas
curl http://localhost:8000/metrics | head -50

# Buscar métricas específicas
curl http://localhost:8000/metrics | grep arkelythex
```

**Deberías ver métricas como**:
```
# HELP arkelythex_ocr_documents_total Total number of documents processed by OCR
# TYPE arkelythex_ocr_documents_total counter
arkelythex_ocr_documents_total{status="success"} 0.0
arkelythex_ocr_documents_total{status="error"} 0.0

# HELP arkelythex_fraud_predictions_total Total fraud predictions made
# TYPE arkelythex_fraud_predictions_total counter
arkelythex_fraud_predictions_total{prediction="fraud"} 0.0
arkelythex_fraud_predictions_total{prediction="legitimate"} 0.0

# ... y muchas más
```

---

### 6. Verificar Prometheus (1 min)

1. **Abrir Prometheus**: http://localhost:9090

2. **Ir a Status → Targets**

3. **Verificar que todos los targets están "UP"**:
   - ✅ `arkelythex-api` (http://arkelythex-api:8000/metrics)
   - ✅ `redis` (http://redis-exporter:9121/metrics)
   - ✅ `prometheus` (http://localhost:9090/metrics)

4. **Probar una query**:
   - Ir a "Graph"
   - Ejecutar: `up{job="arkelythex-api"}`
   - Debería retornar `1` (servicio UP)

---

### 7. Configurar Grafana (2 min)

1. **Abrir Grafana**: http://localhost:3002

2. **Login**:
   - Usuario: `admin`
   - Contraseña: `admin` (o la que configuraste en `GRAFANA_PASSWORD`)

3. **Cambiar contraseña** (recomendado):
   - Grafana te pedirá cambiar la contraseña en el primer login
   - Usa una contraseña segura

4. **Verificar datasource**:
   - Ir a **Connections → Data sources**
   - Deberías ver "Prometheus" configurado y funcionando
   - Click en "Prometheus" → "Test" → Debería decir "Data source is working"

5. **Abrir dashboard**:
   - Ir a **Dashboards**
   - Buscar "Arkelythex API - Overview"
   - Abrir el dashboard

---

### 8. Generar Tráfico de Prueba (opcional, 2 min)

```bash
# Generar 100 requests al health endpoint
for i in {1..100}; do
  curl -s http://localhost:8000/health > /dev/null
  echo -n "."
  sleep 0.1
done
echo " ✓ Done"

# Ver métricas actualizadas
curl http://localhost:8000/metrics | grep 'http_requests_total{.*handler="/health"'
```

**En Grafana**:
- Refrescar el dashboard
- Deberías ver el "Request Rate" aumentar
- El panel de "Request Latency" debería mostrar datos

---

### 9. Ejecutar Script de Testing (opcional, 1 min)

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/arkelythex/drenyra

# Hacer el script ejecutable
chmod +x monitoring/test-monitoring.sh

# Ejecutar tests
./monitoring/test-monitoring.sh
```

Este script verificará:
- ✅ Endpoints básicos funcionando
- ✅ Todas las métricas expuestas
- ✅ Prometheus accesible
- ✅ Grafana accesible

---

## ✅ Verificación Final

### Checklist de Despliegue

- [ ] Arkelythex API responde en http://localhost:8000
- [ ] Endpoint `/metrics` expone métricas
- [ ] Prometheus accesible en http://localhost:9090
- [ ] Todos los targets en Prometheus están "UP"
- [ ] Grafana accesible en http://localhost:3002
- [ ] Dashboard "Arkelythex API - Overview" visible
- [ ] Métricas se actualizan al generar tráfico

### URLs de Acceso

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **Arkelythex API** | http://localhost:8000 | No auth |
| **API Docs** | http://localhost:8000/docs | No auth |
| **Métricas** | http://localhost:8000/metrics | No auth |
| **Prometheus** | http://localhost:9090 | No auth |
| **Grafana** | http://localhost:3002 | admin / [tu contraseña] |
| **Redis Exporter** | http://localhost:9121/metrics | No auth |

---

## 🐛 Troubleshooting

### Arkelythex API no inicia

```bash
# Ver logs
docker-compose logs arkelythex-api

# Errores comunes:
# 1. Puerto 8000 ocupado
sudo lsof -i :8000
# Solución: Cambiar puerto en docker-compose.yml

# 2. Dependencias faltantes
docker-compose exec arkelythex-api pip list | grep prometheus
# Solución: Reinstalar dependencias
```

### Prometheus no scrape

```bash
# Verificar que Arkelythex API es accesible desde Prometheus
docker exec arkelythex-prometheus wget -O- http://arkelythex-api:8000/metrics

# Si falla, verificar red de Docker
docker network inspect arkelythex-network
```

### Grafana no conecta a Prometheus

```bash
# Verificar que Prometheus es accesible desde Grafana
docker exec arkelythex-grafana wget -O- http://prometheus:9090/api/v1/status/config

# Si falla, reiniciar servicios
docker-compose restart prometheus grafana
```

### Métricas no se actualizan

```bash
# Verificar que el instrumentator está activo
curl http://localhost:8000/metrics | grep "http_requests_total"

# Si no aparecen métricas HTTP, verificar que main.py tiene la integración
grep "instrumentator" services/arkelythex-api/app/main.py
```

---

## 🔧 Comandos Útiles

### Gestión de Servicios

```bash
# Ver logs de un servicio específico
docker-compose logs -f arkelythex-api

# Reiniciar un servicio
docker-compose restart arkelythex-api

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ borra datos)
docker-compose down -v

# Ver uso de recursos
docker stats
```

### Consultas en Prometheus

```bash
# Desde la línea de comandos
curl -s 'http://localhost:9090/api/v1/query?query=up' | jq

# Request rate
curl -s 'http://localhost:9090/api/v1/query?query=rate(http_requests_total[5m])' | jq

# OCR success rate
curl -s 'http://localhost:9090/api/v1/query?query=rate(arkelythex_ocr_documents_total{status="success"}[5m])' | jq
```

---

## 📊 Próximos Pasos

### Corto Plazo
1. **Crear dashboards adicionales**:
   - Services Performance
   - Infrastructure Metrics
   - Business Metrics

2. **Configurar alertas**:
   - Las reglas ya están definidas en `monitoring/prometheus/alerts/`
   - Configurar Alertmanager para notificaciones

3. **Testing de carga**:
   - Usar `locust` o `k6`
   - Validar overhead de monitoreo
   - Ajustar thresholds

### Medio Plazo
4. **Optimización**:
   - Recording rules para queries complejas
   - Ajustar retención según espacio disponible
   - Implementar log aggregation (Loki)

5. **Producción**:
   - Configurar HTTPS para Grafana
   - Restringir acceso a puertos de monitoreo
   - Backups de dashboards y configuración

---

## 📚 Documentación Adicional

- [Monitoring README](./README.md) - Documentación completa
- [Integration Guide](../services/arkelythex-api/docs/MONITORING_INTEGRATION.md) - Cómo agregar métricas
- [Deployment Summary](./DEPLOYMENT_SUMMARY.md) - Resumen de implementación
- [Walkthrough](../../.gemini/antigravity/brain/a6ae5fcd-40e9-4a0c-88b1-f4893f753317/walkthrough.md) - Implementación completa

---

## 🎉 ¡Listo!

Si completaste todos los pasos, tu sistema de monitoreo está **100% operacional**.

**Disfruta de la observabilidad completa de Arkelythex API! 🚀**
