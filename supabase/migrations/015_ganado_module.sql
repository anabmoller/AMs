-- ============================================================
-- MIGRATION 015: Modulo de Movimiento de Ganado
-- Date: 2026-03-03
-- Purpose: Cattle movement tracking (guias de ganado SENACSA)
-- ============================================================

-- 1. Extend suppliers table for cattle suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS is_ganadero BOOLEAN DEFAULT false;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS senacsa_code_proveedor TEXT;

-- 2. Extend companies table for destination companies (frigorificos)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_frigorifico BOOLEAN DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS senacsa_code_empresa TEXT;

-- 3. Animal categories lookup table
CREATE TABLE IF NOT EXISTS categorias_animales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  sexo TEXT CHECK (sexo IN ('macho', 'hembra', 'mixto')),
  edad_min_meses INTEGER,
  edad_max_meses INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed the 6 standard SENACSA categories
INSERT INTO categorias_animales (codigo, nombre, descripcion, sexo, edad_min_meses, edad_max_meses) VALUES
  ('DM',  'Destete Macho',       'Ternero macho destetado (6-12 meses)',        'macho',  6,    12),
  ('DH',  'Destete Hembra',      'Ternera hembra destetada (6-12 meses)',       'hembra', 6,    12),
  ('TOR', 'Torito/Toro',         'Toro reproductor o torito',                   'macho',  12,   NULL),
  ('NOV', 'Novillito/Novillo',   'Novillo para engorde o faena',                'macho',  12,   48),
  ('VAQ', 'Vaquillona/Vaca',     'Vaquillona o vaca para cria/engorde',         'hembra', 12,   NULL),
  ('TER', 'Ternero/a',           'Ternero/a al pie de la madre (0-6 meses)',    'mixto',  0,    6)
ON CONFLICT (codigo) DO NOTHING;

-- 4. Main cattle movements table
CREATE TABLE IF NOT EXISTS movimientos_ganado (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movimiento_number TEXT UNIQUE,

  -- SENACSA document numbers
  nro_guia TEXT,
  nro_cota TEXT,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Classification
  finalidad TEXT NOT NULL CHECK (finalidad IN (
    'faena', 'cria', 'engorde', 'remate', 'exposicion',
    'transito', 'cambio_titular', 'otro'
  )),
  tipo_operacion TEXT NOT NULL CHECK (tipo_operacion IN (
    'compra', 'venta', 'transferencia_interna', 'consignacion'
  )),

  -- Origin (FK to existing establishments)
  establecimiento_origen_id UUID REFERENCES establishments(id),

  -- Destination
  empresa_destino_id UUID REFERENCES companies(id),
  establecimiento_destino_id UUID REFERENCES establishments(id),
  destino_nombre TEXT,

  -- Animal totals (aggregated from detalle_movimiento_categorias)
  cantidad_total INTEGER NOT NULL DEFAULT 0 CHECK (cantidad_total >= 0),
  peso_total_kg NUMERIC(10,2) DEFAULT 0,

  -- Financial
  precio_por_kg NUMERIC(12,2),
  precio_total NUMERIC(14,2),
  moneda TEXT DEFAULT 'PYG' CHECK (moneda IN ('PYG', 'USD', 'BRL')),

  -- Status & workflow
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN (
    'borrador', 'pendiente_validacion', 'validado',
    'en_transito', 'recibido', 'cerrado', 'anulado'
  )),

  -- Validation checks
  marca_verificada BOOLEAN DEFAULT false,
  senacsa_verificado BOOLEAN DEFAULT false,
  guia_conforme BOOLEAN DEFAULT false,

  -- Observations
  observaciones TEXT,

  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_by_name TEXT,
  validated_by UUID REFERENCES profiles(id),
  validated_by_name TEXT,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Auto-generate movimiento_number (MG-2026-001, MG-2026-002, ...)
CREATE OR REPLACE FUNCTION generate_movimiento_number()
RETURNS TRIGGER AS $$
DECLARE
  yr TEXT;
  seq INTEGER;
BEGIN
  yr := to_char(NOW(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(movimiento_number FROM 'MG-' || yr || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO seq
  FROM movimientos_ganado
  WHERE movimiento_number LIKE 'MG-' || yr || '-%';
  NEW.movimiento_number := 'MG-' || yr || '-' || LPAD(seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_movimiento_number ON movimientos_ganado;
CREATE TRIGGER trg_movimiento_number
  BEFORE INSERT ON movimientos_ganado
  FOR EACH ROW
  WHEN (NEW.movimiento_number IS NULL)
  EXECUTE FUNCTION generate_movimiento_number();

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_movimientos_estado ON movimientos_ganado(estado);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_ganado(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_movimientos_origen ON movimientos_ganado(establecimiento_origen_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_destino ON movimientos_ganado(empresa_destino_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_created_by ON movimientos_ganado(created_by);
CREATE INDEX IF NOT EXISTS idx_movimientos_created_at ON movimientos_ganado(created_at);

-- 7. Divergences (discrepancies) table
CREATE TABLE IF NOT EXISTS movimiento_divergencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movimiento_id UUID NOT NULL REFERENCES movimientos_ganado(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'cantidad', 'peso', 'categoria', 'marca', 'documento', 'otro'
  )),
  descripcion TEXT NOT NULL,
  cantidad_diferencia INTEGER,
  peso_diferencia_kg NUMERIC(8,2),
  resolucion TEXT,
  resuelto BOOLEAN DEFAULT false,
  reportado_por UUID REFERENCES profiles(id),
  reportado_por_nombre TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_divergencias_movimiento ON movimiento_divergencias(movimiento_id);

-- 8. Attachments (PDFs, photos) table
CREATE TABLE IF NOT EXISTS movimiento_archivos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movimiento_id UUID NOT NULL REFERENCES movimientos_ganado(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('guia_pdf', 'cota_pdf', 'foto', 'otro')),
  nombre TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_archivos_movimiento ON movimiento_archivos(movimiento_id);

-- 9. Detail table: multiple animal categories per movement
CREATE TABLE IF NOT EXISTS detalle_movimiento_categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movimiento_id UUID NOT NULL REFERENCES movimientos_ganado(id) ON DELETE CASCADE,
  categoria_id UUID NOT NULL REFERENCES categorias_animales(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  peso_kg NUMERIC(10,2),
  peso_promedio_kg NUMERIC(8,2) GENERATED ALWAYS AS (
    CASE WHEN cantidad > 0 AND peso_kg IS NOT NULL
         THEN ROUND(peso_kg / cantidad, 2)
         ELSE NULL END
  ) STORED,
  precio_por_kg NUMERIC(12,2),
  precio_subtotal NUMERIC(14,2),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(movimiento_id, categoria_id)
);

CREATE INDEX IF NOT EXISTS idx_detalle_cat_movimiento ON detalle_movimiento_categorias(movimiento_id);
CREATE INDEX IF NOT EXISTS idx_detalle_cat_categoria ON detalle_movimiento_categorias(categoria_id);

-- 10. Trigger: auto-aggregate totals from detalle into movimientos_ganado
CREATE OR REPLACE FUNCTION sync_movimiento_totals()
RETURNS TRIGGER AS $$
DECLARE
  mov_id UUID;
BEGIN
  -- Determine which movimiento_id was affected
  IF TG_OP = 'DELETE' THEN
    mov_id := OLD.movimiento_id;
  ELSE
    mov_id := NEW.movimiento_id;
  END IF;

  UPDATE movimientos_ganado
  SET cantidad_total = COALESCE((
    SELECT SUM(cantidad) FROM detalle_movimiento_categorias WHERE movimiento_id = mov_id
  ), 0),
  peso_total_kg = COALESCE((
    SELECT SUM(peso_kg) FROM detalle_movimiento_categorias WHERE movimiento_id = mov_id
  ), 0)
  WHERE id = mov_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_movimiento_totals ON detalle_movimiento_categorias;
CREATE TRIGGER trg_sync_movimiento_totals
  AFTER INSERT OR UPDATE OR DELETE ON detalle_movimiento_categorias
  FOR EACH ROW
  EXECUTE FUNCTION sync_movimiento_totals();

-- 11. Status change history log
CREATE TABLE IF NOT EXISTS movimiento_estados_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movimiento_id UUID NOT NULL REFERENCES movimientos_ganado(id) ON DELETE CASCADE,
  estado_anterior TEXT NOT NULL,
  estado_nuevo TEXT NOT NULL,
  comentario TEXT,
  changed_by UUID REFERENCES profiles(id),
  changed_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_estados_log_movimiento ON movimiento_estados_log(movimiento_id);
CREATE INDEX IF NOT EXISTS idx_estados_log_created ON movimiento_estados_log(created_at);

-- 12. Pesajes (weighing records) table — THE 7th TABLE
-- Records actual weighing at destination (frigorífico) for reconciliation
CREATE TABLE IF NOT EXISTS pesajes_ganado (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movimiento_id UUID NOT NULL REFERENCES movimientos_ganado(id) ON DELETE CASCADE,

  -- Which category detail row this weighing corresponds to (optional)
  detalle_categoria_id UUID REFERENCES detalle_movimiento_categorias(id) ON DELETE SET NULL,

  -- Weighing data
  fecha_pesaje DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_pesaje TIME,
  cantidad_pesada INTEGER NOT NULL CHECK (cantidad_pesada > 0),
  peso_bruto_kg NUMERIC(10,2) NOT NULL CHECK (peso_bruto_kg > 0),
  peso_tara_kg NUMERIC(10,2) DEFAULT 0,
  peso_neto_kg NUMERIC(10,2) GENERATED ALWAYS AS (peso_bruto_kg - COALESCE(peso_tara_kg, 0)) STORED,
  peso_promedio_kg NUMERIC(8,2) GENERATED ALWAYS AS (
    CASE WHEN cantidad_pesada > 0
         THEN ROUND((peso_bruto_kg - COALESCE(peso_tara_kg, 0)) / cantidad_pesada, 2)
         ELSE NULL END
  ) STORED,

  -- Tropa/lot identification
  nro_tropa TEXT,
  nro_lote TEXT,

  -- Classification at weighing time
  categoria_id UUID REFERENCES categorias_animales(id),
  tipo_pesaje TEXT NOT NULL DEFAULT 'recepcion' CHECK (tipo_pesaje IN (
    'recepcion', 'despacho', 'intermedio', 'verificacion'
  )),

  -- Comparison with guia (expected vs actual)
  cantidad_esperada INTEGER,
  peso_esperado_kg NUMERIC(10,2),
  diferencia_cantidad INTEGER GENERATED ALWAYS AS (
    CASE WHEN cantidad_esperada IS NOT NULL
         THEN cantidad_pesada - cantidad_esperada
         ELSE NULL END
  ) STORED,
  diferencia_peso_kg NUMERIC(10,2) GENERATED ALWAYS AS (
    CASE WHEN peso_esperado_kg IS NOT NULL
         THEN (peso_bruto_kg - COALESCE(peso_tara_kg, 0)) - peso_esperado_kg
         ELSE NULL END
  ) STORED,

  -- Balanza (scale) info
  balanza_id TEXT,
  balanza_nombre TEXT,
  ticket_nro TEXT,

  -- Validation
  conforme BOOLEAN DEFAULT false,
  observaciones TEXT,

  -- Audit
  pesado_por UUID REFERENCES profiles(id),
  pesado_por_nombre TEXT,
  verificado_por UUID REFERENCES profiles(id),
  verificado_por_nombre TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pesajes_movimiento ON pesajes_ganado(movimiento_id);
CREATE INDEX IF NOT EXISTS idx_pesajes_fecha ON pesajes_ganado(fecha_pesaje);
CREATE INDEX IF NOT EXISTS idx_pesajes_categoria ON pesajes_ganado(categoria_id);
CREATE INDEX IF NOT EXISTS idx_pesajes_detalle ON pesajes_ganado(detalle_categoria_id);
CREATE INDEX IF NOT EXISTS idx_pesajes_tipo ON pesajes_ganado(tipo_pesaje);

-- 12b. Trigger: auto-update updated_at on pesajes
CREATE OR REPLACE FUNCTION update_pesajes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pesajes_updated_at ON pesajes_ganado;
CREATE TRIGGER trg_pesajes_updated_at
  BEFORE UPDATE ON pesajes_ganado
  FOR EACH ROW
  EXECUTE FUNCTION update_pesajes_updated_at();

-- 13. Updated_at trigger for movimientos_ganado
CREATE OR REPLACE FUNCTION update_movimientos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_movimientos_updated_at ON movimientos_ganado;
CREATE TRIGGER trg_movimientos_updated_at
  BEFORE UPDATE ON movimientos_ganado
  FOR EACH ROW
  EXECUTE FUNCTION update_movimientos_updated_at();

-- 14. Audit triggers (reuse existing audit_trigger_func from 001)
DO $$
BEGIN
  CREATE TRIGGER trg_audit_movimientos_ganado
    AFTER INSERT OR UPDATE OR DELETE ON movimientos_ganado
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER trg_audit_movimiento_divergencias
    AFTER INSERT OR UPDATE OR DELETE ON movimiento_divergencias
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER trg_audit_detalle_categorias
    AFTER INSERT OR UPDATE OR DELETE ON detalle_movimiento_categorias
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TRIGGER trg_audit_estados_log
    AFTER INSERT OR UPDATE OR DELETE ON movimiento_estados_log
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 15. RLS Policies
ALTER TABLE movimientos_ganado ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimiento_divergencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimiento_archivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_animales ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_movimiento_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimiento_estados_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesajes_ganado ENABLE ROW LEVEL SECURITY;

-- categorias_animales: everyone can read
CREATE POLICY "categorias_animales_select" ON categorias_animales
  FOR SELECT USING (true);

-- movimientos_ganado: authenticated users can read
CREATE POLICY "movimientos_select" ON movimientos_ganado
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "movimientos_service_insert" ON movimientos_ganado
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "movimientos_service_update" ON movimientos_ganado
  FOR UPDATE TO service_role USING (true);
CREATE POLICY "movimientos_service_delete" ON movimientos_ganado
  FOR DELETE TO service_role USING (true);

-- divergencias
CREATE POLICY "divergencias_select" ON movimiento_divergencias
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "divergencias_service_insert" ON movimiento_divergencias
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "divergencias_service_update" ON movimiento_divergencias
  FOR UPDATE TO service_role USING (true);

-- archivos
CREATE POLICY "archivos_select" ON movimiento_archivos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "archivos_service_insert" ON movimiento_archivos
  FOR INSERT TO service_role WITH CHECK (true);

-- detalle_movimiento_categorias
CREATE POLICY "detalle_cat_select" ON detalle_movimiento_categorias
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "detalle_cat_service_insert" ON detalle_movimiento_categorias
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "detalle_cat_service_update" ON detalle_movimiento_categorias
  FOR UPDATE TO service_role USING (true);
CREATE POLICY "detalle_cat_service_delete" ON detalle_movimiento_categorias
  FOR DELETE TO service_role USING (true);

-- movimiento_estados_log
CREATE POLICY "estados_log_select" ON movimiento_estados_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "estados_log_service_insert" ON movimiento_estados_log
  FOR INSERT TO service_role WITH CHECK (true);

-- pesajes_ganado
CREATE POLICY "pesajes_select" ON pesajes_ganado
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "pesajes_service_insert" ON pesajes_ganado
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "pesajes_service_update" ON pesajes_ganado
  FOR UPDATE TO service_role USING (true);
CREATE POLICY "pesajes_service_delete" ON pesajes_ganado
  FOR DELETE TO service_role USING (true);

-- Audit trigger for pesajes_ganado
DO $$
BEGIN
  CREATE TRIGGER trg_audit_pesajes_ganado
    AFTER INSERT OR UPDATE OR DELETE ON pesajes_ganado
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
