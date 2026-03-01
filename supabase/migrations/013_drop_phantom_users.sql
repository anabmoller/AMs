-- ============================================================
-- MIGRATION 013: Remover tabela "users" fantasma
-- Date: 2026-03-01
-- A tabela "users" (criada por migration 003) NÃO é usada pelo app.
-- O app usa "profiles" (sincronizada com auth.users).
-- ⚠️ DESTRUTIVA — fazer backup antes de executar.
-- ============================================================

-- 1) Dropar views que referenciam "users"
DROP VIEW IF EXISTS v_active_approvers CASCADE;
DROP VIEW IF EXISTS v_users_with_entities CASCADE;
DROP VIEW IF EXISTS v_users_with_establishments CASCADE;

-- 2) Dropar tabela backup se existir
DROP TABLE IF EXISTS _backup_users_20260301;

-- 3) Dropar tabela users (CASCADE remove FKs dependentes)
-- As junction tables (user_establishments, user_fiscal_entities)
-- têm FKs para users(id) — CASCADE as remove.
-- Migration 014 recria as FKs apontando para profiles.
DROP TABLE IF EXISTS users CASCADE;

-- 4) Recriar views apontando para profiles
CREATE OR REPLACE VIEW v_active_approvers AS
SELECT id, username, name, role, is_super_approver, can_approve
FROM profiles
WHERE active = true
  AND can_approve = true;

CREATE OR REPLACE VIEW v_users_with_establishments AS
SELECT
  p.id, p.username, p.name, p.role, p.establishment,
  e.name AS establishment_name, e.code AS establishment_code
FROM profiles p
LEFT JOIN establishments e ON p.establishment = e.name
WHERE p.active = true;

-- v_users_with_entities needs fiscal_entities junction (created in 014)
-- Placeholder that works without junction:
CREATE OR REPLACE VIEW v_users_with_entities AS
SELECT
  p.id, p.username, p.name, p.role, p.establishment,
  NULL::text AS fiscal_entity,
  NULL::text AS ruc,
  NULL::boolean AS is_default_entity
FROM profiles p
WHERE p.active = true;

-- VERIFICAÇÃO:
SELECT 'v_active_approvers' AS view_name, COUNT(*) AS rows FROM v_active_approvers
UNION ALL
SELECT 'v_users_with_establishments', COUNT(*) FROM v_users_with_establishments
UNION ALL
SELECT 'v_users_with_entities', COUNT(*) FROM v_users_with_entities;

-- Confirm users table is gone:
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'users' AND table_schema = 'public'
) AS users_table_still_exists;
