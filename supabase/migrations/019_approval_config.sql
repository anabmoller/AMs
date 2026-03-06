-- ============================================================
-- MIGRATION 019: Approval Config to DB
-- Date: 2026-03-06
-- PR-2 of house-cleaning audit
--
-- Problem: Approval thresholds, SLA times, president mappings,
-- special approvers (vet, overbudget, super-approvers) are all
-- hardcoded in approvalEngine.ts and approvalConfig.js.
--
-- Fix: Create approval_config table for key-value settings,
-- add president column to companies, seed all current values.
-- The Edge Function already reads manager/director from DB
-- (request-workflow lines 70-84); this extends that pattern.
-- ============================================================

-- ============================================================
-- 1. ADD president COLUMN TO companies
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'president'
  ) THEN
    ALTER TABLE companies ADD COLUMN president TEXT;
  END IF;
END $$;

-- ============================================================
-- 2. CREATE approval_config TABLE
-- Key-value store for approval engine parameters.
-- category groups related settings together.
-- ============================================================
CREATE TABLE IF NOT EXISTS approval_config (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category   TEXT NOT NULL,
  key        TEXT NOT NULL,
  value      TEXT NOT NULL,
  description TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (category, key)
);

ALTER TABLE approval_config ENABLE ROW LEVEL SECURITY;

-- All authenticated can read (approval engine needs this)
CREATE POLICY approval_config_select ON approval_config
  FOR SELECT TO authenticated
  USING (true);

-- Only service_role can write (admin panel via Edge Functions)
CREATE POLICY approval_config_service ON approval_config
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_approval_config_category ON approval_config(category);

-- ============================================================
-- 3. SEED THRESHOLDS
-- ============================================================
INSERT INTO approval_config (category, key, value, description) VALUES
  ('threshold', 'director_required',  '5000000',  'Amount in Gs above which director approval is required'),
  ('threshold', 'president_required', '50000000', 'Amount in Gs above which president approval is required')
ON CONFLICT (category, key) DO NOTHING;

-- ============================================================
-- 4. SEED SLA (hours)
-- ============================================================
INSERT INTO approval_config (category, key, value, description) VALUES
  ('sla', 'manager_normal',    '24', 'Manager SLA in hours — normal priority'),
  ('sla', 'manager_emergency', '4',  'Manager SLA in hours — emergency priority'),
  ('sla', 'director_normal',   '48', 'Director SLA in hours — normal priority'),
  ('sla', 'director_emergency','8',  'Director SLA in hours — emergency priority'),
  ('sla', 'overbudget',        '48', 'Overbudget step SLA in hours')
ON CONFLICT (category, key) DO NOTHING;

-- ============================================================
-- 5. SEED SPECIAL APPROVERS
-- ============================================================
INSERT INTO approval_config (category, key, value, description) VALUES
  ('special_approver', 'vet_approver',      'rodrigo.ferreira', 'Primary vet/farmacia specialist'),
  ('special_approver', 'vet_approver_2',    'paulo',            'Secondary vet confirmation — gerente'),
  ('special_approver', 'overbudget_approver','mauricio',         'Overbudget approval (below president threshold)')
ON CONFLICT (category, key) DO NOTHING;

-- ============================================================
-- 6. SEED VET SECTORS
-- ============================================================
INSERT INTO approval_config (category, key, value, description) VALUES
  ('vet_sectors', 'list', 'Veterinária,Farmacia,Veterinaria', 'Comma-separated sector names requiring vet approval')
ON CONFLICT (category, key) DO NOTHING;

-- ============================================================
-- 7. SEED SUPER-APPROVERS (username:limit pairs)
-- ============================================================
INSERT INTO approval_config (category, key, value, description) VALUES
  ('super_approver', 'mauricio', 'Infinity',          'Can approve any step up to unlimited amount'),
  ('super_approver', 'ronei',    '100000000000',      'Can approve any step up to 100B Gs')
ON CONFLICT (category, key) DO NOTHING;

-- ============================================================
-- 8. SEED PRESIDENT MAPPINGS INTO companies TABLE
-- ============================================================
UPDATE companies SET president = 'mauricio'
WHERE name = 'Rural Bioenergia S.A.' AND (president IS NULL OR president = '');

UPDATE companies SET president = 'ana.karina'
WHERE name = 'Chacobras S.A.' AND (president IS NULL OR president = '');

UPDATE companies SET president = 'ana.karina'
WHERE name = 'La Constancia' AND (president IS NULL OR president = '');

UPDATE companies SET president = 'ronei'
WHERE name = 'Control Pasto S.A.' AND (president IS NULL OR president = '');

-- ============================================================
-- 9. SEED ESTABLISHMENT MANAGERS (if not already set)
-- These mirror MANAGER_BY_ESTABLISHMENT in approvalEngine.ts
-- ============================================================
UPDATE establishments SET manager = 'paulo'
WHERE name ILIKE '%ypoti%' AND (manager IS NULL OR manager = '');

UPDATE establishments SET manager = 'fabiano'
WHERE name ILIKE '%cerro memby%' AND (manager IS NULL OR manager = '');

UPDATE establishments SET manager = 'fabiano'
WHERE name ILIKE '%ybypora%' AND (manager IS NULL OR manager = '');

UPDATE establishments SET manager = 'pedro'
WHERE name ILIKE '%cielo azul%' AND (manager IS NULL OR manager = '');

UPDATE establishments SET manager = 'fabiano'
WHERE name ILIKE '%santa clara%' AND (manager IS NULL OR manager = '');

UPDATE establishments SET manager = 'fabiano'
WHERE name ILIKE '%yby pyta%' AND (manager IS NULL OR manager = '');

UPDATE establishments SET manager = 'fabiano'
WHERE name ILIKE '%lusipar%' AND (manager IS NULL OR manager = '');

UPDATE establishments SET manager = 'pedro'
WHERE name ILIKE '%santa maria%' AND (manager IS NULL OR manager = '');

UPDATE establishments SET manager = 'paulo'
WHERE name ILIKE '%oro verde%' AND (manager IS NULL OR manager = '');

-- ============================================================
-- 10. SEED COMPANY DIRECTORS (if not already set)
-- These mirror DIRECTOR_BY_COMPANY in approvalEngine.ts
-- ============================================================
UPDATE companies SET director = 'ronei'
WHERE name = 'Rural Bioenergia S.A.' AND (director IS NULL OR director = '');

UPDATE companies SET director = 'ronei'
WHERE name = 'Chacobras S.A.' AND (director IS NULL OR director = '');

UPDATE companies SET director = 'ana.karina'
WHERE name = 'La Constancia' AND (director IS NULL OR director = '');

UPDATE companies SET director = 'ana'
WHERE name = 'Control Pasto S.A.' AND (director IS NULL OR director = '');

UPDATE companies SET director = 'ana.moller'
WHERE name = 'Ana Moller' AND (director IS NULL OR director = '');

UPDATE companies SET director = 'gabriel'
WHERE name = 'Gabriel Moller' AND (director IS NULL OR director = '');

UPDATE companies SET director = 'pedro.moller'
WHERE name = 'Pedro Moller' AND (director IS NULL OR director = '');

-- ============================================================
-- DONE — Summary:
--
-- NEW COLUMN: companies.president
-- NEW TABLE: approval_config (thresholds, SLA, special approvers)
-- SEEDED: All hardcoded values from approvalEngine.ts
-- SEEDED: Manager/director/president into existing tables
--
-- Next: approvalEngine.ts reads from approval_config instead
-- of hardcoded constants (with fallback for safety).
-- ============================================================
SELECT '✅ MIGRATION 019 (approval config to DB) APPLIED!' as resultado;
