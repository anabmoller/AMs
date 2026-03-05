# Ganado ETL — Supabase Integration Guide

## Overview

The Ganado ETL pipeline loads historical data from three spreadsheet sources into
normalized Supabase tables (`etl_*` prefix). These tables power analytics views
consumed by the SIGAM UI.

**Notion documentation:**
- [Database Model SQL — Ganadero](https://www.notion.so/) — table schemas, FKs, indexes
- [ETL Pipeline — Data Model Ganadero](https://www.notion.so/) — extraction rules, cleaning steps
- [Analytics — Pipeline Insights](https://www.notion.so/) — KPI definitions, aggregation logic

> See also: `docs/ganado/RELATORIO_PIPELINE.md` for the full pipeline report with
> data volumes, cleaning rules, and analytical insights.

---

## Architecture

```
Spreadsheets (3 sources)
       │
       ▼
 etl_pipeline.py          ── Extract, clean, normalize → CSV
       │
       ▼
 ingest_to_supabase.py    ── Load CSVs into etl_* tables
       │
       ▼
 Supabase (PostgreSQL)
   ├── etl_fazendas          (280 establishments)
   ├── etl_provedores        (1,324 suppliers)
   ├── etl_compras           (2,547 purchases)
   ├── etl_cotas             (guide groups)
   ├── etl_guias             (2,448 transport guides)
   ├── etl_movimentacoes     (259 operational movements)
   ├── etl_animais           (future individual traceability)
   └── vw_* analytics views  (6 views)
       │
       ▼
 src/constants/ganado.js   ── Supabase client functions
       │
       ▼
 SIGAM UI (Ganado module)
```

---

## Database Tables

Migration: `supabase/migrations/017_ganado_etl_tables.sql`

| Table | Records | Purpose |
|-------|---------|---------|
| `etl_fazendas` | 280 | Establishments (own + supplier + frigorificos) |
| `etl_provedores` | 1,324 | Cattle suppliers with purchase history |
| `etl_compras` | 2,547 | Historical purchases 2017–2023 |
| `etl_cotas` | ~200 | SENACSA guide groups |
| `etl_guias` | 2,448 | Individual transport guides |
| `etl_movimentacoes` | 259 | Operational movement log (from Asana) |
| `etl_animais` | — | Individual animal traceability (future) |

### Key relationships

- `etl_compras.id_provedor` → `etl_provedores.id`
- `etl_compras.id_fazenda_destino` → `etl_fazendas.id`
- `etl_guias.id_cota` → `etl_cotas.id`
- `etl_guias.id_establecimiento_origen/destino` → `etl_fazendas.id`
- `etl_movimentacoes.id_fazenda_destino` → `etl_fazendas.id`
- `etl_animais` → `etl_fazendas`, `etl_compras`, `etl_guias`

---

## Analytics Views

| View | Description |
|------|-------------|
| `vw_ganado_por_establecimiento` | Total cattle purchased per establishment |
| `vw_compras_por_proveedor` | Purchase summary by supplier |
| `vw_peso_por_categoria` | Average weight and price per animal category |
| `vw_movimientos_por_destino` | Movement distribution by own establishments |
| `vw_tendencia_compras_anual` | Yearly purchase trends (volume, spend, suppliers) |
| `vw_trazabilidad_completa` | Full traceability: guide → origin → destination → cota |

---

## Ingestion Script

```bash
# Dry run (parse only, no insert)
python scripts/ganado/ingest_to_supabase.py --dry-run

# Full ingestion
python scripts/ganado/ingest_to_supabase.py

# Clear and reload
python scripts/ganado/ingest_to_supabase.py --truncate
```

Requires env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

---

## UI Data Layer

Functions in `src/constants/ganado.js`:

| Function | Source |
|----------|--------|
| `fetchGanadoPorEstablecimiento()` | `vw_ganado_por_establecimiento` |
| `fetchComprasPorProveedor()` | `vw_compras_por_proveedor` |
| `fetchPesoPorCategoria()` | `vw_peso_por_categoria` |
| `fetchMovimientosPorDestino()` | `vw_movimientos_por_destino` |
| `fetchTendenciaAnual()` | `vw_tendencia_compras_anual` |
| `fetchTrazabilidad()` | `vw_trazabilidad_completa` |
| `fetchETLFazendas()` | `etl_fazendas` |

---

## RLS Policies

- **Read**: All authenticated users can SELECT from `etl_*` tables
- **Write**: Only `service_role` (used by the ingestion script)

---

## Files

| Path | Purpose |
|------|---------|
| `supabase/migrations/017_ganado_etl_tables.sql` | Migration (tables + views + RLS) |
| `scripts/ganado/ingest_to_supabase.py` | CSV → Supabase ingestion |
| `scripts/ganado/etl_pipeline.py` | Raw spreadsheets → normalized CSV |
| `scripts/ganado/database_model.sql` | Reference SQL model (from Notion) |
| `src/constants/ganado.js` | UI data layer functions |
| `data/ganado/*.csv` | Normalized CSV outputs |
| `data/ganado/analytics.json` | Pre-computed KPIs |
