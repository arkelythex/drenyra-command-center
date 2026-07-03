# Proposal: CSV Batch Processing — Parallel Agent Workflows

## Problem
Fiscal Agent 24/7 procesa secuencial. Con 1000+ transacciones/mes, el pipeline nocturno escala mal.

## Solution
Inspiración: Codex `spawn_agents_on_csv`. Un CSV de transacciones, N workers paralelos, resultados consolidados.

## Key Design
```csv
transaction_id,amount,date,description,vendor,tax_id
T001,1500.00,2026-07-01,"Consultoría","Proveedor SAC","20546296564"
```

- CSV subido → dividido en batches de 100 rows
- Cada batch → worker BullMQ independiente (hasta 10 concurrentes)
- Cada worker ejecuta: Categorizar → Calcular → Reconciliar
- Resultados consolidados al final → reporte único
