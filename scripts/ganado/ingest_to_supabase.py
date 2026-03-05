#!/usr/bin/env python3
"""
Ganado ETL → Supabase Ingestion Script
---------------------------------------
Loads normalized CSV data (output of etl_pipeline.py) into the
etl_* tables created by migration 017_ganado_etl_tables.sql.

Pipeline steps:
  1. Load raw CSVs from data/ganado/
  2. Apply cleaning rules (handle NaN, type coercion, date parsing)
  3. Insert into Supabase etl_* tables in FK order

Usage:
  python scripts/ganado/ingest_to_supabase.py
  python scripts/ganado/ingest_to_supabase.py --data-dir ./data/ganado --dry-run
  python scripts/ganado/ingest_to_supabase.py --truncate  # clear tables first

Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
          (or .env file in project root)
"""

import argparse
import csv
import json
import math
import os
import sys
from datetime import datetime
from pathlib import Path


def load_env():
    """Load .env file from project root if it exists."""
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, val = line.partition("=")
                    os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))


def clean_val(val):
    """Normalize empty/NaN values to None."""
    if val is None:
        return None
    if isinstance(val, float) and math.isnan(val):
        return None
    s = str(val).strip()
    if s in ("", "nan", "NaN", "None", "null"):
        return None
    return s


def parse_float(val):
    """Parse a numeric value, handling PY locale (1.234,56) and NaN."""
    v = clean_val(val)
    if v is None:
        return None
    # Remove thousands separator if PY format detected
    if "," in v and "." in v:
        v = v.replace(".", "").replace(",", ".")
    elif "," in v:
        v = v.replace(",", ".")
    try:
        f = float(v)
        return None if math.isnan(f) or math.isinf(f) else f
    except (ValueError, TypeError):
        return None


def parse_int(val):
    """Parse integer, handling floats like '280.0'."""
    f = parse_float(val)
    if f is None:
        return None
    return int(round(f))


def parse_date(val):
    """Parse date string to ISO format."""
    v = clean_val(val)
    if v is None:
        return None
    # Strip time portion if present
    if " " in v:
        v = v.split(" ")[0]
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(v, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def read_csv(filepath):
    """Read a CSV file and return list of dicts."""
    rows = []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def build_fazendas(data_dir):
    """Build fazendas records from CSV."""
    rows = read_csv(data_dir / "fazendas.csv")
    records = []
    for row in rows:
        records.append({
            "id": parse_int(row.get("id_fazenda")),
            "nome": clean_val(row.get("nome")),
            "tipo": clean_val(row.get("tipo")) or "PROVEDOR",
            "latitude": parse_float(row.get("latitude")),
            "longitude": parse_float(row.get("longitude")),
        })
    return records


def build_provedores(data_dir):
    """Build provedores records from CSV."""
    rows = read_csv(data_dir / "provedores.csv")
    records = []
    for row in rows:
        records.append({
            "id": parse_int(row.get("id_provedor")),
            "nome": clean_val(row.get("nome")),
            "total_compras": parse_int(row.get("n_compras")),
            "total_animales": parse_int(row.get("total_animales")),
            "primeira_compra": parse_date(row.get("primera_compra")),
            "ultima_compra": parse_date(row.get("ultima_compra")),
        })
    return records


def build_compras(data_dir):
    """Build compras records from CSV."""
    rows = read_csv(data_dir / "compras.csv")
    records = []
    for row in rows:
        records.append({
            "id": parse_int(row.get("id_compra")),
            "fecha": parse_date(row.get("fecha")),
            "id_provedor": parse_int(row.get("id_provedor")),
            "id_fazenda_destino": parse_int(row.get("id_fazenda_destino")),
            "categoria": clean_val(row.get("categoria")),
            "cantidad_animales": parse_int(row.get("cantidad_animales")),
            "modalidad": clean_val(row.get("modalidad")),
            "precio_unitario": parse_float(row.get("precio_unitario")),
            "precio_total": parse_float(row.get("precio_total")),
            "peso_total_kg": parse_float(row.get("peso_total_kg")),
            "peso_promedio_kg": parse_float(row.get("peso_promedio_kg")),
            "costo_flete": parse_float(row.get("costo_flete")),
            "costo_comision": parse_float(row.get("costo_comision")),
            "intermediario": clean_val(row.get("intermediario")),
            "fletero": clean_val(row.get("fletero")),
            "nro_factura": clean_val(row.get("nro_factura")),
            "departamento": clean_val(row.get("departamento")),
            "distrito": clean_val(row.get("distrito")),
            "pais": clean_val(row.get("pais")) or "PARAGUAY",
            "sola_marca": clean_val(row.get("sola_marca")),
            "ano": parse_int(row.get("ano")),
        })
    return records


def build_guias(data_dir):
    """Build guias records from CSV. Cotas are extracted inline."""
    rows = read_csv(data_dir / "guias.csv")
    cotas = {}  # nro_cota → record
    records = []

    for row in rows:
        nro_cota = parse_int(row.get("nro_cota"))
        fecha = parse_date(row.get("fecha"))

        # Collect cotas
        if nro_cota and nro_cota not in cotas:
            cotas[nro_cota] = {
                "nro_cota": nro_cota,
                "fecha_emision": fecha,
                "total_guias": 0,
                "total_animales": 0,
            }
        if nro_cota:
            cotas[nro_cota]["total_guias"] += 1
            cotas[nro_cota]["total_animales"] += parse_int(row.get("cantidad_animales")) or 0

        finalidad = clean_val(row.get("finalidad"))
        if finalidad and finalidad.upper() not in ("ENGORDE", "FAENA", "CRIA"):
            finalidad = None  # Invalid value (coordinate data, etc.)

        records.append({
            "nro_guia": parse_int(row.get("nro_guia")),
            "nro_cota_raw": nro_cota,  # used to resolve FK after cota insert
            "fecha_emision": fecha,
            "finalidad": finalidad.upper() if finalidad else None,
            "ruc_origen": clean_val(row.get("ruc_origen")),
            "cod_origen": parse_int(row.get("cod_origen")),
            "ruc_destino": clean_val(row.get("ruc_destino")),
            "cod_destino": parse_int(row.get("cod_destino")),
            "categoria": clean_val(row.get("categoria")),
            "cod_categoria": clean_val(row.get("cod_categoria")),
            "cantidad_animales": parse_int(row.get("cantidad_animales")),
        })

    return list(cotas.values()), records


def build_movimentacoes(data_dir):
    """Build movimentacoes records from CSV."""
    rows = read_csv(data_dir / "movimentacoes.csv")
    records = []

    tipo_map = {
        "compra": "COMPRA", "venta": "VENTA",
        "traslado": "TRASLADO_INTERNO", "traslado_interno": "TRASLADO_INTERNO",
        "entrada": "ENTRADA", "salida": "SALIDA",
    }

    for row in rows:
        tipo_raw = clean_val(row.get("tipo_movimiento")) or ""
        tipo = tipo_map.get(tipo_raw.lower().replace(" ", "_"), "COMPRA")

        records.append({
            "tipo": tipo,
            "descricao": clean_val(row.get("descricao")),
            "fecha_creacion": parse_date(row.get("fecha_creacion")),
            "fecha_completado": parse_date(row.get("fecha_completado")),
            "fecha_embarque": parse_date(row.get("fecha_embarque")),
            "cantidad_animales": parse_int(row.get("cantidad_animales")),
            "categoria": clean_val(row.get("categoria")),
            "responsavel": clean_val(row.get("responsavel")),
            "intermediario": clean_val(row.get("intermediario")),
            "status": clean_val(row.get("status")),
            "prioridad": clean_val(row.get("prioridad")),
            "notas": clean_val(row.get("notas")),
            "id_asana": parse_int(row.get("id_mov_asana")),
        })
    return records


def insert_batch(supabase, table, records, batch_size=500):
    """Insert records in batches, return count inserted."""
    total = 0
    for i in range(0, len(records), batch_size):
        batch = records[i : i + batch_size]
        # Remove None-valued keys to let DB defaults apply
        cleaned = []
        for rec in batch:
            cleaned.append({k: v for k, v in rec.items() if v is not None})
        result = supabase.table(table).insert(cleaned).execute()
        total += len(batch)
    return total


def main():
    parser = argparse.ArgumentParser(description="Ingest Ganado ETL CSVs into Supabase")
    parser.add_argument("--data-dir", default="data/ganado", help="Path to CSV directory")
    parser.add_argument("--dry-run", action="store_true", help="Parse data without inserting")
    parser.add_argument("--truncate", action="store_true", help="Truncate tables before insert")
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    if not data_dir.exists():
        print(f"Error: data directory not found: {data_dir}")
        sys.exit(1)

    # ---- Parse all CSVs ----
    print("=" * 60)
    print("GANADO ETL → SUPABASE INGESTION")
    print("=" * 60)

    print("\n[1/5] Loading fazendas...")
    fazendas = build_fazendas(data_dir)
    print(f"       {len(fazendas)} fazendas parsed")

    print("[2/5] Loading provedores...")
    provedores = build_provedores(data_dir)
    print(f"       {len(provedores)} provedores parsed")

    print("[3/5] Loading compras...")
    compras = build_compras(data_dir)
    print(f"       {len(compras)} compras parsed")

    print("[4/5] Loading guias + cotas...")
    cotas, guias = build_guias(data_dir)
    print(f"       {len(cotas)} cotas, {len(guias)} guias parsed")

    print("[5/5] Loading movimentacoes...")
    movimentacoes = build_movimentacoes(data_dir)
    print(f"       {len(movimentacoes)} movimentacoes parsed")

    total = len(fazendas) + len(provedores) + len(compras) + len(cotas) + len(guias) + len(movimentacoes)
    print(f"\n  TOTAL: {total} records ready for ingestion")

    if args.dry_run:
        print("\n[DRY RUN] No data inserted. Exiting.")
        # Print sample records for verification
        if fazendas:
            print(f"\n  Sample fazenda: {json.dumps(fazendas[0], default=str, indent=2)}")
        if compras:
            print(f"\n  Sample compra: {json.dumps(compras[0], default=str, indent=2)}")
        return

    # ---- Connect to Supabase ----
    load_env()
    url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        print("\nError: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars")
        print("  (or add them to .env in project root)")
        sys.exit(1)

    try:
        from supabase import create_client
    except ImportError:
        print("\nError: pip install supabase")
        sys.exit(1)

    sb = create_client(url, key)

    # ---- Truncate if requested ----
    if args.truncate:
        print("\n[TRUNCATE] Clearing existing data...")
        for table in ["etl_animais", "etl_movimentacoes", "etl_guias", "etl_cotas", "etl_compras", "etl_provedores", "etl_fazendas"]:
            sb.rpc("", {}).execute()  # no-op; use raw SQL via management API
            # For safety, delete all rows
            try:
                sb.table(table).delete().neq("id", -999999).execute()
                print(f"  Cleared {table}")
            except Exception as e:
                print(f"  Warning: could not clear {table}: {e}")

    # ---- Insert in FK order ----
    print("\n[INSERT] Loading data into Supabase...")

    n = insert_batch(sb, "etl_fazendas", fazendas)
    print(f"  etl_fazendas:       {n} rows")

    n = insert_batch(sb, "etl_provedores", provedores)
    print(f"  etl_provedores:     {n} rows")

    n = insert_batch(sb, "etl_compras", compras)
    print(f"  etl_compras:        {n} rows")

    # Insert cotas and build nro_cota → id map
    cota_records = []
    for c in cotas:
        cota_records.append({
            "nro_cota": c["nro_cota"],
            "fecha_emision": c["fecha_emision"],
            "total_guias": c["total_guias"],
            "total_animales": c["total_animales"],
        })
    n = insert_batch(sb, "etl_cotas", cota_records)
    print(f"  etl_cotas:          {n} rows")

    # Fetch cota IDs to resolve guia FKs
    cota_map = {}
    resp = sb.table("etl_cotas").select("id, nro_cota").execute()
    for row in resp.data:
        cota_map[row["nro_cota"]] = row["id"]

    # Build guia insert records with resolved FK
    guia_records = []
    for g in guias:
        rec = {
            "nro_guia": g["nro_guia"],
            "fecha_emision": g["fecha_emision"],
            "finalidad": g["finalidad"],
            "ruc_origen": g["ruc_origen"],
            "cod_origen": g["cod_origen"],
            "ruc_destino": g["ruc_destino"],
            "cod_destino": g["cod_destino"],
            "categoria": g["categoria"],
            "cod_categoria": g["cod_categoria"],
            "cantidad_animales": g["cantidad_animales"],
        }
        nro_cota = g.get("nro_cota_raw")
        if nro_cota and nro_cota in cota_map:
            rec["id_cota"] = cota_map[nro_cota]
        guia_records.append(rec)

    n = insert_batch(sb, "etl_guias", guia_records)
    print(f"  etl_guias:          {n} rows")

    n = insert_batch(sb, "etl_movimentacoes", movimentacoes)
    print(f"  etl_movimentacoes:  {n} rows")

    print(f"\n{'=' * 60}")
    print(f"✅ INGESTION COMPLETE — {total} records loaded")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
