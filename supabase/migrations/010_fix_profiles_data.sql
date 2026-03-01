-- ============================================================
-- MIGRATION 010: Corrigir roles, nomes e flags em profiles
-- Date: 2026-03-01
-- Depends on: 009_enhance_profiles.sql (new columns)
-- ============================================================

-- ──────────────────────────────────────
-- 1) MAURICIO MOLLER → super_approver
-- DB has: diretoria. Needs: super_approver (manage_quotations, manage_settings)
-- ──────────────────────────────────────
UPDATE profiles SET
  role = 'super_approver',
  is_super_approver = true,
  can_approve = true
WHERE username = 'mauricio';

-- ──────────────────────────────────────
-- 2) RONEI → director + fix nome
-- DB has: diretoria, name="Ronei Ferreira"
-- Needs: director, name="Ronei Barrios"
-- ──────────────────────────────────────
UPDATE profiles SET
  role = 'director',
  name = 'Ronei Barrios',
  can_approve = true
WHERE username = 'ronei';

-- ──────────────────────────────────────
-- 3) ANA BEATRIZ MOLLER → admin (já está, setar flags)
-- ──────────────────────────────────────
UPDATE profiles SET
  can_approve = true
WHERE username = 'ana.moller' AND role = 'admin';

-- ──────────────────────────────────────
-- 4) TODOS OS GERENTES → can_approve = true
-- Inclui: paulo, fabiano, pedro.moller, gabriel, ana.karina,
--         lucas.enrico, rosevaldo.dos, etc.
-- ──────────────────────────────────────
UPDATE profiles SET can_approve = true
WHERE role = 'gerente'
  AND can_approve IS DISTINCT FROM true;

-- ──────────────────────────────────────
-- 5) LAURA RIVAS → role "compras" (era "comprador")
-- can_approve = false (cotiza mas NÃO aprova)
-- ──────────────────────────────────────
UPDATE profiles SET
  role = 'compras',
  can_approve = false
WHERE username = 'laura.rivas';

-- ──────────────────────────────────────
-- 6) RAMÓN SOSA → role "solicitante" (era "comprador")
-- ──────────────────────────────────────
UPDATE profiles SET
  role = 'solicitante',
  can_approve = false
WHERE username = 'ramon.sosa';

-- ──────────────────────────────────────
-- 7) ANAHI AGUIRRE → lider, can_approve = true
-- DB has: comprador. Should be: lider
-- ──────────────────────────────────────
UPDATE profiles SET
  role = 'lider',
  can_approve = true
WHERE username = 'anahi';

-- ──────────────────────────────────────
-- 8) TODOS OS LÍDERES → can_approve = true
-- ──────────────────────────────────────
UPDATE profiles SET can_approve = true
WHERE role = 'lider'
  AND can_approve IS DISTINCT FROM true;

-- ──────────────────────────────────────
-- 9) SOLICITANTES / OPERACIONAIS → can_approve = false
-- ──────────────────────────────────────
UPDATE profiles SET can_approve = false
WHERE role IN ('solicitante', 'operacional')
  AND can_approve IS DISTINCT FROM false;

-- ──────────────────────────────────────
-- 10) COMPRADORES restantes → can_approve = false
-- ──────────────────────────────────────
UPDATE profiles SET can_approve = false
WHERE role IN ('comprador', 'compras')
  AND can_approve IS DISTINCT FROM false;

-- ──────────────────────────────────────
-- 11) Telefones dos usuários-chave
-- ──────────────────────────────────────
UPDATE profiles SET phone = '+595982798122' WHERE username = 'mauricio' AND phone IS NULL;
UPDATE profiles SET phone = '+5567992125955' WHERE username = 'ronei' AND phone IS NULL;
UPDATE profiles SET phone = '+595982164005' WHERE username = 'ana.moller' AND phone IS NULL;
UPDATE profiles SET phone = '+5567996526585' WHERE username = 'paulo' AND phone IS NULL;
UPDATE profiles SET phone = '+595975366371' WHERE username = 'fabiano' AND phone IS NULL;
UPDATE profiles SET phone = '+595983796436' WHERE username = 'pedro.moller' AND phone IS NULL;
UPDATE profiles SET phone = '+595987166668' WHERE username = 'laura.rivas' AND phone IS NULL;
UPDATE profiles SET phone = '+595975576161' WHERE username = 'ramon.sosa' AND phone IS NULL;

-- ──────────────────────────────────────
-- VERIFICAÇÃO
-- ──────────────────────────────────────
SELECT username, name, role, is_super_approver, can_approve, phone
FROM profiles
WHERE username IN (
  'mauricio', 'ronei', 'ana.moller', 'paulo', 'fabiano',
  'pedro.moller', 'gabriel', 'ana.karina',
  'laura.rivas', 'ramon.sosa', 'anahi'
)
ORDER BY
  CASE role
    WHEN 'super_approver' THEN 1
    WHEN 'director' THEN 2
    WHEN 'admin' THEN 3
    WHEN 'gerente' THEN 4
    WHEN 'lider' THEN 5
    WHEN 'compras' THEN 6
    WHEN 'solicitante' THEN 7
    ELSE 8
  END;

-- Distribution check
SELECT role, can_approve, COUNT(*) as total
FROM profiles
WHERE active = true
GROUP BY role, can_approve
ORDER BY role;
