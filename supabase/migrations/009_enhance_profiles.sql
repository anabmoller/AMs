-- ============================================================
-- MIGRATION 009: Adicionar campos à tabela profiles
-- Date: 2026-03-01
-- A tabela "profiles" é a FONTE DA VERDADE do app.
-- Campos necessários: is_super_approver, can_approve, phone
-- ============================================================

-- 1) Campos de aprovação
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_approver BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS can_approve BOOLEAN DEFAULT false;

-- 2) Campo de telefone
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3) Índices para buscas comuns
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(active);
CREATE INDEX IF NOT EXISTS idx_profiles_can_approve ON profiles(can_approve) WHERE can_approve = true;
CREATE INDEX IF NOT EXISTS idx_profiles_super_approver ON profiles(is_super_approver) WHERE is_super_approver = true;

-- 4) Verificação
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('is_super_approver', 'can_approve', 'phone')
ORDER BY column_name;
