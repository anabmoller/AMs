-- ============================================================
-- MIGRATION 016: Ganado Enhancements (incorporações do Cowork)
-- Date: 2026-03-03
-- Purpose: Adicionar tabelas e colunas extras do Cowork que
--          NÃO conflitam com o schema 015 + Edge Function
-- Depends on: 015_ganado_module.sql
-- ============================================================

-- ============================================================
-- 1. COMISIONISTAS — Tabela nova do Cowork
-- ============================================================
CREATE TABLE IF NOT EXISTS comisionistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  telefono TEXT,
  email TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE comisionistas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comisionistas_select" ON comisionistas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "comisionistas_service_insert" ON comisionistas
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "comisionistas_service_update" ON comisionistas
  FOR UPDATE TO service_role USING (true);
CREATE POLICY "comisionistas_service_delete" ON comisionistas
  FOR DELETE TO service_role USING (true);

-- Seed comisionistas reais
INSERT INTO comisionistas (nombre) VALUES
  ('Ronaldo'), ('Adriano'), ('Cristino'), ('Dario'), ('Claudemir'),
  ('Pedro Moller'), ('Luis Prieto'), ('Albino Friesen'), ('Pedro'), ('Ferusa'),
  ('Luis Perez'), ('Cesar'), ('Mauricio'), ('Lucas'), ('Acosta Remates S.A.'),
  ('Corral Del Norte'), ('Arroba Remate'), ('Pie Monte')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- 2. ANIMALES_INDIVIDUALES — Tabela nova do Cowork
--    Para rastreamento por caravana (IDE) — fase futura
-- ============================================================
CREATE TABLE IF NOT EXISTS animales_individuales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  ide TEXT NOT NULL UNIQUE,
  ide_visual TEXT,

  -- Relações
  movimiento_entrada_id UUID REFERENCES movimientos_ganado(id),
  movimiento_salida_id UUID REFERENCES movimientos_ganado(id),
  categoria_id UUID REFERENCES categorias_animales(id),
  proveedor_id UUID REFERENCES suppliers(id),

  -- Características
  raza TEXT,
  sexo TEXT CHECK (sexo IN ('macho', 'hembra')),
  carimbo TEXT,

  -- Origem
  comisionista TEXT,
  lugar_compra TEXT,
  precio_compra NUMERIC(15,2),

  -- Datas
  fecha_nacimiento DATE,
  fecha_entrada DATE,
  fecha_salida DATE,

  -- Peso e desempenho
  peso_entrada_kg NUMERIC(10,2),
  peso_actual_kg NUMERIC(10,2),
  gdm_desde_entrada NUMERIC(5,2),
  gdm_desde_ultimo NUMERIC(5,2),
  ganancia_peso_total NUMERIC(10,2),

  -- Localização
  ubicacion_actual TEXT,
  potrero_actual TEXT,

  -- Estado
  estado TEXT DEFAULT 'corriente' CHECK (estado IN ('corriente', 'vendido', 'fallecido', 'transferido')),
  estado_fecha DATE,
  clasificacion TEXT,
  sanitacion TEXT,

  -- Auditoria
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_animales_ide ON animales_individuales(ide);
CREATE INDEX IF NOT EXISTS idx_animales_estado ON animales_individuales(estado);
CREATE INDEX IF NOT EXISTS idx_animales_raza ON animales_individuales(raza);
CREATE INDEX IF NOT EXISTS idx_animales_ubicacion ON animales_individuales(ubicacion_actual);
CREATE INDEX IF NOT EXISTS idx_animales_entrada ON animales_individuales(movimiento_entrada_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_animales_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_animales_updated ON animales_individuales;
CREATE TRIGGER trg_animales_updated
  BEFORE UPDATE ON animales_individuales
  FOR EACH ROW
  EXECUTE FUNCTION update_animales_timestamp();

ALTER TABLE animales_individuales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "animales_select" ON animales_individuales
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "animales_service_insert" ON animales_individuales
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "animales_service_update" ON animales_individuales
  FOR UPDATE TO service_role USING (true);
CREATE POLICY "animales_service_delete" ON animales_individuales
  FOR DELETE TO service_role USING (true);

-- ============================================================
-- 3. CATEGORIAS EXTRAS — 4 categorias adicionais do Cowork
-- ============================================================

-- Adicionar colunas extras do Cowork
ALTER TABLE categorias_animales ADD COLUMN IF NOT EXISTS peso_min_kg NUMERIC(10,2);
ALTER TABLE categorias_animales ADD COLUMN IF NOT EXISTS peso_max_kg NUMERIC(10,2);
ALTER TABLE categorias_animales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Insertar categorias extras (as 6 originais do 015 já existem)
INSERT INTO categorias_animales (codigo, nombre, descripcion, sexo, edad_min_meses, edad_max_meses, peso_min_kg, peso_max_kg) VALUES
  ('VACA',         'Vaca',          'Vaca adulta',                    'hembra', 36,   NULL, 350, 600),
  ('VAQUILLA',     'Vaquilla',      'Vaquilla (hembra joven)',        'hembra', 12,   36,   200, 350),
  ('TORETON',      'Toretón',       'Torete en desarrollo',          'macho',  18,   30,   300, 450),
  ('TORO_CRIOLLO', 'Toro Criollo',  'Toro de raza criolla',          'macho',  24,   NULL, 400, 700)
ON CONFLICT (codigo) DO NOTHING;

-- Atualizar peso ranges nas 6 categorias originais (dados do Cowork)
UPDATE categorias_animales SET peso_min_kg = 120, peso_max_kg = 200 WHERE codigo = 'DH'  AND peso_min_kg IS NULL;
UPDATE categorias_animales SET peso_min_kg = 130, peso_max_kg = 220 WHERE codigo = 'DM'  AND peso_min_kg IS NULL;
UPDATE categorias_animales SET peso_min_kg = 200, peso_max_kg = 350 WHERE codigo = 'NOV' AND peso_min_kg IS NULL;
UPDATE categorias_animales SET peso_min_kg = 30,  peso_max_kg = 150 WHERE codigo = 'TER' AND peso_min_kg IS NULL;
UPDATE categorias_animales SET peso_min_kg = 350, peso_max_kg = 800 WHERE codigo = 'TOR' AND peso_min_kg IS NULL;
UPDATE categorias_animales SET peso_min_kg = 200, peso_max_kg = 400 WHERE codigo = 'VAQ' AND peso_min_kg IS NULL;

-- ============================================================
-- 4. MOVIMIENTOS_GANADO — Colunas extras do Cowork
-- ============================================================

-- Link direto ao proveedor (supplier)
ALTER TABLE movimientos_ganado ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);

-- Datas operacionais extras
ALTER TABLE movimientos_ganado ADD COLUMN IF NOT EXISTS fecha_operacion DATE;
ALTER TABLE movimientos_ganado ADD COLUMN IF NOT EXISTS fecha_transito_inicio DATE;
ALTER TABLE movimientos_ganado ADD COLUMN IF NOT EXISTS fecha_transito_fin DATE;
ALTER TABLE movimientos_ganado ADD COLUMN IF NOT EXISTS fecha_recepcion DATE;

-- Documentação SENACSA extra
ALTER TABLE movimientos_ganado ADD COLUMN IF NOT EXISTS guia_senacsa TEXT;

-- Financeiro extra
ALTER TABLE movimientos_ganado ADD COLUMN IF NOT EXISTS precio_por_cabeza NUMERIC(12,2);

-- Peso promedio agregado
ALTER TABLE movimientos_ganado ADD COLUMN IF NOT EXISTS peso_promedio_kg NUMERIC(10,2);

-- Comisionista (FK opcional)
ALTER TABLE movimientos_ganado ADD COLUMN IF NOT EXISTS comisionista_id UUID REFERENCES comisionistas(id);

-- Índices extras
CREATE INDEX IF NOT EXISTS idx_movimientos_supplier ON movimientos_ganado(supplier_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON movimientos_ganado(tipo_operacion);

-- ============================================================
-- 5. PESAJES_GANADO — Coluna extra do Cowork
-- ============================================================

-- Desbaste (porcentagem de perda de peso em transporte/ayuno)
ALTER TABLE pesajes_ganado ADD COLUMN IF NOT EXISTS desbaste_porcentaje NUMERIC(5,2) DEFAULT 0;

-- ============================================================
-- 6. MOVIMIENTO_DIVERGENCIAS — Colunas extras do Cowork
-- ============================================================

-- Valores genéricos de comparação
ALTER TABLE movimiento_divergencias ADD COLUMN IF NOT EXISTS valor_esperado TEXT;
ALTER TABLE movimiento_divergencias ADD COLUMN IF NOT EXISTS valor_recibido TEXT;

-- Estado mais rico (complementa o boolean resuelto existente)
ALTER TABLE movimiento_divergencias ADD COLUMN IF NOT EXISTS estado_divergencia TEXT
  DEFAULT 'pendiente' CHECK (estado_divergencia IN ('pendiente', 'justificado', 'ajustado', 'rechazado'));

-- Justificativa separada
ALTER TABLE movimiento_divergencias ADD COLUMN IF NOT EXISTS justificacion TEXT;

-- Resolução com timestamp
ALTER TABLE movimiento_divergencias ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE movimiento_divergencias ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES profiles(id);

-- ============================================================
-- 7. MOVIMIENTO_ARCHIVOS — Tipos extra de documento
-- ============================================================

-- Expandir CHECK de tipo para incluir opções do Cowork
-- O 015 tem: guia_pdf, cota_pdf, foto, otro
-- O Cowork tem: guia_senacsa, factura, romaneio, certificado, foto, otro
-- Solução: dropar constraint antiga e criar nova com TODOS os valores
ALTER TABLE movimiento_archivos DROP CONSTRAINT IF EXISTS movimiento_archivos_tipo_check;
ALTER TABLE movimiento_archivos ADD CONSTRAINT movimiento_archivos_tipo_check
  CHECK (tipo IN ('guia_pdf', 'cota_pdf', 'guia_senacsa', 'factura', 'romaneio', 'certificado', 'foto', 'otro'));

-- ============================================================
-- 8. AUDIT TRIGGER para novas tabelas
-- ============================================================
DO $$
BEGIN
  CREATE TRIGGER trg_audit_comisionistas
    AFTER INSERT OR UPDATE OR DELETE ON comisionistas
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
EXCEPTION WHEN duplicate_object THEN NULL;
         WHEN undefined_function THEN NULL; -- audit_trigger_func may not exist
END $$;

DO $$
BEGIN
  CREATE TRIGGER trg_audit_animales_individuales
    AFTER INSERT OR UPDATE OR DELETE ON animales_individuales
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
EXCEPTION WHEN duplicate_object THEN NULL;
         WHEN undefined_function THEN NULL;
END $$;

-- ============================================================
-- 9. VERIFICAÇÃO FINAL
-- ============================================================
SELECT '✅ MIGRATION 016 APLICADA COM SUCESSO!' as resultado;

SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') as colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'categorias_animales', 'comisionistas', 'movimientos_ganado',
    'detalle_movimiento_categorias', 'movimiento_estados_log',
    'pesajes_ganado', 'movimiento_divergencias', 'movimiento_archivos',
    'animales_individuales'
  )
ORDER BY table_name;
