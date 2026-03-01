-- ============================================================
-- MIGRATION 002: Security & Compliance Tables — Compras Ypoti
-- Date: 2026-03-01
-- Purpose: Audit trail, auth logging, security policies,
--          supplier evaluations, non-conformities, document
--          versioning, and automatic audit triggers.
-- ============================================================

-- ============================================================
-- 1. AUDIT TRAIL TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_trail (
  id         BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id  TEXT NOT NULL,
  action     TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data   JSONB,
  new_data   JSONB,
  user_id    UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_trail_table   ON audit_trail(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_trail_record  ON audit_trail(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user    ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created ON audit_trail(created_at);

-- ============================================================
-- 2. AUTH AUDIT LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS auth_audit_log (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details    JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_user    ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_event   ON auth_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created ON auth_audit_log(created_at);

-- ============================================================
-- 3. SECURITY POLICIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS security_policies (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  iso_reference TEXT,
  version       TEXT,
  status        TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'review', 'archived')),
  next_review   DATE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_policies_status ON security_policies(status);

-- ============================================================
-- 4. SUPPLIER EVALUATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS supplier_evaluations (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id      UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  period           TEXT NOT NULL,
  quality_score    NUMERIC(4,2) CHECK (quality_score >= 0 AND quality_score <= 10),
  delivery_score   NUMERIC(4,2) CHECK (delivery_score >= 0 AND delivery_score <= 10),
  price_score      NUMERIC(4,2) CHECK (price_score >= 0 AND price_score <= 10),
  compliance_score NUMERIC(4,2) CHECK (compliance_score >= 0 AND compliance_score <= 10),
  total_score      NUMERIC(4,2) CHECK (total_score >= 0 AND total_score <= 10),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_eval_supplier ON supplier_evaluations(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_eval_period   ON supplier_evaluations(period);

-- ============================================================
-- 5. NON-CONFORMITIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS non_conformities (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id       UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  type              TEXT NOT NULL,
  description       TEXT NOT NULL,
  severity          TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  corrective_action TEXT,
  preventive_action TEXT,
  status            TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  reported_by       UUID,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_non_conformities_supplier ON non_conformities(supplier_id);
CREATE INDEX IF NOT EXISTS idx_non_conformities_status   ON non_conformities(status);
CREATE INDEX IF NOT EXISTS idx_non_conformities_severity ON non_conformities(severity);

-- ============================================================
-- 6. DOCUMENT VERSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS document_versions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type TEXT NOT NULL,
  document_id   UUID NOT NULL,
  version       INTEGER DEFAULT 1,
  data          JSONB,
  created_by    UUID,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_versions_type ON document_versions(document_type);
CREATE INDEX IF NOT EXISTS idx_doc_versions_doc  ON document_versions(document_id);

-- ============================================================
-- 7. AUDIT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_trail (table_name, record_id, action, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id::TEXT, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_trail (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id::TEXT, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_trail (table_name, record_id, action, old_data, user_id)
    VALUES (TG_TABLE_NAME, OLD.id::TEXT, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. AUDIT TRIGGERS ON KEY TABLES
-- ============================================================

-- Trigger on purchase_requests (requests table)
DROP TRIGGER IF EXISTS audit_purchase_requests ON requests;
CREATE TRIGGER audit_purchase_requests
  AFTER INSERT OR UPDATE OR DELETE ON requests
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Trigger on suppliers
DROP TRIGGER IF EXISTS audit_suppliers ON suppliers;
CREATE TRIGGER audit_suppliers
  AFTER INSERT OR UPDATE OR DELETE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Trigger on products
DROP TRIGGER IF EXISTS audit_products ON products;
CREATE TRIGGER audit_products
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Trigger on price_history
DROP TRIGGER IF EXISTS audit_price_history ON price_history;
CREATE TRIGGER audit_price_history
  AFTER INSERT OR UPDATE OR DELETE ON price_history
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE audit_trail       ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE non_conformities  ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- Read policies (authenticated users can read)
DO $$ BEGIN
  CREATE POLICY audit_trail_select ON audit_trail FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY auth_audit_log_select ON auth_audit_log FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY security_policies_select ON security_policies FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY supplier_evaluations_select ON supplier_evaluations FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY non_conformities_select ON non_conformities FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY document_versions_select ON document_versions FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 10. SEED SECURITY POLICIES (ISO 27001 / 9001 / 27701 / 27018)
-- ============================================================
INSERT INTO security_policies (title, description, iso_reference, version, status, next_review) VALUES
  (
    'Política de Control de Acceso',
    'Define los controles de acceso lógico y físico para proteger los activos de información. Incluye gestión de identidades, autenticación multifactor y principio de mínimo privilegio.',
    'ISO 27001 - A.9',
    '1.0',
    'active',
    '2026-09-01'
  ),
  (
    'Política de Gestión de Incidentes de Seguridad',
    'Establece los procedimientos para la detección, respuesta, recuperación y lecciones aprendidas ante incidentes de seguridad de la información.',
    'ISO 27001 - A.16',
    '1.0',
    'active',
    '2026-09-01'
  ),
  (
    'Política de Gestión de Proveedores',
    'Regula la evaluación, selección, monitoreo y reevaluación de proveedores para asegurar el cumplimiento de requisitos de calidad y seguridad.',
    'ISO 9001 - 8.4',
    '1.0',
    'active',
    '2026-06-01'
  ),
  (
    'Política de Calidad y Mejora Continua',
    'Compromiso con la mejora continua de procesos, satisfacción del cliente y cumplimiento de requisitos legales y reglamentarios aplicables.',
    'ISO 9001 - 10.3',
    '1.0',
    'active',
    '2026-06-01'
  ),
  (
    'Política de Privacidad de Datos Personales',
    'Define los principios, derechos y obligaciones para el tratamiento de datos personales de empleados, clientes y proveedores.',
    'ISO 27701 - 7.2',
    '1.0',
    'active',
    '2026-09-01'
  ),
  (
    'Política de Retención y Eliminación de Datos',
    'Establece los plazos de retención, archivado y eliminación segura de datos personales y corporativos según requisitos legales.',
    'ISO 27701 - 7.4.7',
    '1.0',
    'draft',
    '2026-12-01'
  ),
  (
    'Política de Protección de Datos en la Nube',
    'Controles específicos para la protección de información personal identificable (PII) procesada en servicios de nube pública.',
    'ISO 27018 - A.1',
    '1.0',
    'active',
    '2026-09-01'
  ),
  (
    'Política de Transferencia Internacional de Datos',
    'Regula las condiciones y salvaguardas para la transferencia de datos personales a terceros países o proveedores internacionales de servicios en la nube.',
    'ISO 27018 - A.12',
    '1.0',
    'draft',
    '2026-12-01'
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- VERIFICATION
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '--- 002_security_compliance.sql applied successfully ---';
  RAISE NOTICE 'Tables created: audit_trail, auth_audit_log, security_policies, supplier_evaluations, non_conformities, document_versions';
  RAISE NOTICE 'Triggers installed on: requests, suppliers, products, price_history';
END $$;
