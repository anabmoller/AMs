-- ============================================================
-- MIGRATION 017: Ganado ETL Normalized Tables
-- Date: 2026-03-04
-- Purpose: Create analytical tables from ETL pipeline to store
--          historical purchase, guide, and movement data from
--          spreadsheet sources. These complement the operational
--          tables from 015/016 with normalized historical data.
-- Depends on: 015_ganado_module.sql, 016_ganado_enhancements.sql
-- Source: Notion "Database Model SQL — Ganadero"
-- ============================================================

-- Schema prefix: etl_ to avoid conflicts with operational tables

-- ============================================================
-- 1. FAZENDAS (Establecimientos — normalized from ETL)
-- ============================================================
CREATE TABLE IF NOT EXISTS etl_fazendas (
    id              SERIAL PRIMARY KEY,
    nome            VARCHAR(200) NOT NULL,
    tipo            VARCHAR(20) NOT NULL CHECK (tipo IN ('PROPRIA', 'PROVEDOR', 'FRIGORIFICO')),
    latitude        DECIMAL(10, 6),
    longitude       DECIMAL(10, 6),
    departamento    VARCHAR(100),
    distrito        VARCHAR(100),
    cod_senacsa     BIGINT,
    proprietario    VARCHAR(200),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_etl_fazendas_tipo ON etl_fazendas(tipo);
CREATE INDEX IF NOT EXISTS idx_etl_fazendas_nome ON etl_fazendas(nome);

-- ============================================================
-- 2. PROVEDORES (Proveedores — normalized from ETL)
-- ============================================================
CREATE TABLE IF NOT EXISTS etl_provedores (
    id              SERIAL PRIMARY KEY,
    nome            VARCHAR(300) NOT NULL,
    ruc             VARCHAR(30),
    telefone        VARCHAR(50),
    email           VARCHAR(200),
    endereco        TEXT,
    total_compras   INTEGER DEFAULT 0,
    total_animales  INTEGER DEFAULT 0,
    primeira_compra DATE,
    ultima_compra   DATE,
    ativo           BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_etl_provedores_nome ON etl_provedores(nome);
CREATE INDEX IF NOT EXISTS idx_etl_provedores_ruc ON etl_provedores(ruc);

-- ============================================================
-- 3. COMPRAS (Purchases — normalized from ETL)
-- ============================================================
CREATE TABLE IF NOT EXISTS etl_compras (
    id              SERIAL PRIMARY KEY,
    fecha           DATE NOT NULL,
    id_provedor     INTEGER REFERENCES etl_provedores(id),
    id_fazenda_origem INTEGER REFERENCES etl_fazendas(id),
    id_fazenda_destino INTEGER REFERENCES etl_fazendas(id),
    categoria       VARCHAR(50) NOT NULL,
    cantidad_animales INTEGER NOT NULL CHECK (cantidad_animales > 0),
    modalidad       VARCHAR(30),
    precio_unitario DECIMAL(15, 2),
    precio_total    DECIMAL(18, 2),
    peso_total_kg   DECIMAL(12, 2),
    peso_promedio_kg DECIMAL(8, 2),
    costo_flete     DECIMAL(15, 2),
    costo_comision  DECIMAL(15, 2),
    intermediario   VARCHAR(200),
    fletero         VARCHAR(200),
    nro_factura     VARCHAR(50),
    departamento    VARCHAR(100),
    distrito        VARCHAR(100),
    pais            VARCHAR(30) DEFAULT 'PARAGUAY',
    sola_marca      VARCHAR(10),
    ano             INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_etl_compras_fecha ON etl_compras(fecha);
CREATE INDEX IF NOT EXISTS idx_etl_compras_provedor ON etl_compras(id_provedor);
CREATE INDEX IF NOT EXISTS idx_etl_compras_destino ON etl_compras(id_fazenda_destino);
CREATE INDEX IF NOT EXISTS idx_etl_compras_categoria ON etl_compras(categoria);
CREATE INDEX IF NOT EXISTS idx_etl_compras_ano ON etl_compras(ano);

-- ============================================================
-- 4. COTAS (Guide groups — normalized from ETL)
-- ============================================================
CREATE TABLE IF NOT EXISTS etl_cotas (
    id              SERIAL PRIMARY KEY,
    nro_cota        BIGINT NOT NULL UNIQUE,
    fecha_emision   DATE,
    total_guias     INTEGER DEFAULT 0,
    total_animales  INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_etl_cotas_nro ON etl_cotas(nro_cota);

-- ============================================================
-- 5. GUIAS (Transport guides — normalized from ETL)
-- ============================================================
CREATE TABLE IF NOT EXISTS etl_guias (
    id              SERIAL PRIMARY KEY,
    nro_guia        BIGINT NOT NULL,
    id_cota         INTEGER REFERENCES etl_cotas(id),
    fecha_emision   DATE,
    finalidad       VARCHAR(30) CHECK (finalidad IN ('ENGORDE', 'FAENA', 'CRIA')),
    id_empresa_origen INTEGER,
    ruc_origen      VARCHAR(30),
    id_establecimiento_origen INTEGER REFERENCES etl_fazendas(id),
    cod_origen      BIGINT,
    id_empresa_destino INTEGER,
    ruc_destino     VARCHAR(30),
    id_establecimiento_destino INTEGER REFERENCES etl_fazendas(id),
    cod_destino     BIGINT,
    categoria       VARCHAR(50),
    cod_categoria   VARCHAR(10),
    cantidad_animales INTEGER NOT NULL CHECK (cantidad_animales > 0),
    id_compra       INTEGER REFERENCES etl_compras(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_etl_guias_nro ON etl_guias(nro_guia);
CREATE INDEX IF NOT EXISTS idx_etl_guias_cota ON etl_guias(id_cota);
CREATE INDEX IF NOT EXISTS idx_etl_guias_fecha ON etl_guias(fecha_emision);
CREATE INDEX IF NOT EXISTS idx_etl_guias_destino ON etl_guias(id_establecimiento_destino);

-- ============================================================
-- 6. MOVIMENTACOES (Operational traceability — from ETL)
-- ============================================================
CREATE TABLE IF NOT EXISTS etl_movimentacoes (
    id              SERIAL PRIMARY KEY,
    tipo            VARCHAR(30) NOT NULL CHECK (tipo IN ('COMPRA', 'VENTA', 'TRASLADO_INTERNO', 'ENTRADA', 'SALIDA')),
    descricao       TEXT,
    fecha_creacion  DATE,
    fecha_completado DATE,
    fecha_embarque  DATE,
    id_fazenda_destino INTEGER REFERENCES etl_fazendas(id),
    cantidad_animales INTEGER,
    categoria       VARCHAR(50),
    responsavel     VARCHAR(200),
    intermediario   VARCHAR(200),
    status          VARCHAR(30),
    prioridad       VARCHAR(20),
    notas           TEXT,
    id_asana        BIGINT,
    id_compra       INTEGER REFERENCES etl_compras(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_etl_movs_tipo ON etl_movimentacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_etl_movs_fecha ON etl_movimentacoes(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_etl_movs_destino ON etl_movimentacoes(id_fazenda_destino);

-- ============================================================
-- 7. ANIMAIS (Individual traceability — future)
-- ============================================================
CREATE TABLE IF NOT EXISTS etl_animais (
    id              SERIAL PRIMARY KEY,
    codigo_brinco   VARCHAR(30),
    categoria       VARCHAR(50),
    sexo            VARCHAR(10),
    raca            VARCHAR(50),
    id_fazenda_atual INTEGER REFERENCES etl_fazendas(id),
    id_compra_entrada INTEGER REFERENCES etl_compras(id),
    id_guia_entrada INTEGER REFERENCES etl_guias(id),
    fecha_entrada   DATE,
    peso_entrada_kg DECIMAL(8, 2),
    id_guia_salida  INTEGER REFERENCES etl_guias(id),
    fecha_salida    DATE,
    motivo_salida   VARCHAR(50),
    ativo           BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_etl_animais_fazenda ON etl_animais(id_fazenda_atual);
CREATE INDEX IF NOT EXISTS idx_etl_animais_compra ON etl_animais(id_compra_entrada);
CREATE INDEX IF NOT EXISTS idx_etl_animais_brinco ON etl_animais(codigo_brinco);

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE etl_fazendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_provedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_cotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_guias ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE etl_animais ENABLE ROW LEVEL SECURITY;

-- Read access for authenticated users
CREATE POLICY "etl_fazendas_select" ON etl_fazendas FOR SELECT TO authenticated USING (true);
CREATE POLICY "etl_provedores_select" ON etl_provedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "etl_compras_select" ON etl_compras FOR SELECT TO authenticated USING (true);
CREATE POLICY "etl_cotas_select" ON etl_cotas FOR SELECT TO authenticated USING (true);
CREATE POLICY "etl_guias_select" ON etl_guias FOR SELECT TO authenticated USING (true);
CREATE POLICY "etl_movimentacoes_select" ON etl_movimentacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "etl_animais_select" ON etl_animais FOR SELECT TO authenticated USING (true);

-- Write access for service role only (ETL pipeline)
CREATE POLICY "etl_fazendas_service" ON etl_fazendas FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "etl_provedores_service" ON etl_provedores FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "etl_compras_service" ON etl_compras FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "etl_cotas_service" ON etl_cotas FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "etl_guias_service" ON etl_guias FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "etl_movimentacoes_service" ON etl_movimentacoes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "etl_animais_service" ON etl_animais FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 9. ANALYTICS VIEWS
-- ============================================================

-- Total cattle by establishment
CREATE OR REPLACE VIEW vw_ganado_por_establecimiento AS
SELECT
    f.id, f.nome, f.tipo, f.latitude, f.longitude,
    COALESCE(SUM(c.cantidad_animales), 0) AS total_animales_comprados,
    COUNT(DISTINCT c.id) AS total_compras,
    COUNT(DISTINCT c.id_provedor) AS provedores_distintos
FROM etl_fazendas f
LEFT JOIN etl_compras c ON c.id_fazenda_destino = f.id
GROUP BY f.id, f.nome, f.tipo, f.latitude, f.longitude;

-- Purchases by provider
CREATE OR REPLACE VIEW vw_compras_por_proveedor AS
SELECT
    p.id, p.nome, p.ruc,
    COUNT(c.id) AS n_compras,
    COALESCE(SUM(c.cantidad_animales), 0) AS total_animales,
    MIN(c.fecha) AS primera_compra,
    MAX(c.fecha) AS ultima_compra,
    ROUND(AVG(c.cantidad_animales), 1) AS avg_animales_por_compra,
    COALESCE(SUM(c.precio_total), 0) AS total_invertido
FROM etl_provedores p
LEFT JOIN etl_compras c ON c.id_provedor = p.id
GROUP BY p.id, p.nome, p.ruc;

-- Average weight per category
CREATE OR REPLACE VIEW vw_peso_por_categoria AS
SELECT
    c.categoria,
    COUNT(*) AS n_compras,
    SUM(c.cantidad_animales) AS total_animales,
    ROUND(AVG(c.peso_promedio_kg), 2) AS peso_promedio_kg,
    ROUND(AVG(c.precio_unitario), 2) AS precio_unitario_promedio,
    MIN(c.fecha) AS primera_fecha,
    MAX(c.fecha) AS ultima_fecha
FROM etl_compras c
WHERE c.peso_promedio_kg > 0
GROUP BY c.categoria
ORDER BY total_animales DESC;

-- Movement distribution by destination
CREATE OR REPLACE VIEW vw_movimientos_por_destino AS
SELECT
    f.nome AS destino,
    f.tipo,
    COUNT(DISTINCT c.id) AS total_compras,
    COALESCE(SUM(c.cantidad_animales), 0) AS total_animales,
    COALESCE(SUM(c.precio_total), 0) AS total_invertido,
    COUNT(DISTINCT c.id_provedor) AS provedores_distintos,
    COUNT(DISTINCT g.id) AS total_guias
FROM etl_fazendas f
LEFT JOIN etl_compras c ON c.id_fazenda_destino = f.id
LEFT JOIN etl_guias g ON g.id_establecimiento_destino = f.id
WHERE f.tipo = 'PROPRIA'
GROUP BY f.id, f.nome, f.tipo
ORDER BY total_animales DESC;

-- Yearly purchase trends
CREATE OR REPLACE VIEW vw_tendencia_compras_anual AS
SELECT
    c.ano,
    COUNT(*) AS n_compras,
    SUM(c.cantidad_animales) AS total_animales,
    COALESCE(SUM(c.precio_total), 0) AS total_invertido,
    ROUND(AVG(c.cantidad_animales), 1) AS avg_animales_por_compra,
    ROUND(AVG(c.precio_unitario), 2) AS avg_precio_unitario,
    COUNT(DISTINCT c.id_provedor) AS provedores_activos
FROM etl_compras c
WHERE c.ano IS NOT NULL
GROUP BY c.ano
ORDER BY c.ano;

-- Complete traceability view
CREATE OR REPLACE VIEW vw_trazabilidad_completa AS
SELECT
    g.nro_guia, g.fecha_emision, g.finalidad, g.categoria, g.cantidad_animales,
    fo.nome AS fazenda_origen, fd.nome AS fazenda_destino,
    co.nro_cota
FROM etl_guias g
LEFT JOIN etl_fazendas fo ON fo.id = g.id_establecimiento_origen
LEFT JOIN etl_fazendas fd ON fd.id = g.id_establecimiento_destino
LEFT JOIN etl_cotas co ON co.id = g.id_cota;

-- ============================================================
-- 10. VERIFICATION
-- ============================================================
SELECT '✅ MIGRATION 017 (ETL tables + analytics views) APPLIED!' as resultado;
