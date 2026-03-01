-- ============================================================
-- MIGRATION 011: Criar perfil para VET_APPROVER
-- Date: 2026-03-01
-- O workflow veterinário depende de rodrigo.ferreira como
-- primeiro aprovador. Precisa existir em profiles.
-- ============================================================

-- PASSO 1: Verificar se já existe em profiles
SELECT id, username, name, role FROM profiles
WHERE username = 'rodrigo.ferreira';

-- PASSO 2: Verificar se existe em auth.users
SELECT id, email FROM auth.users
WHERE email = 'rodrigo.ferreira@ypoti.local';

-- PASSO 3: Se existe em auth.users mas NÃO em profiles, inserir:
INSERT INTO profiles (id, username, email, name, role, establishment, active, can_approve, is_super_approver)
SELECT
  au.id,
  'rodrigo.ferreira',
  au.email,
  'Rodrigo Ferreira',
  'gerente',
  'Ypoti',
  true,
  true,
  false
FROM auth.users au
WHERE au.email = 'rodrigo.ferreira@ypoti.local'
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE username = 'rodrigo.ferreira')
ON CONFLICT (id) DO UPDATE SET
  username = 'rodrigo.ferreira',
  name = 'Rodrigo Ferreira',
  role = 'gerente',
  can_approve = true,
  active = true;

-- ============================================================
-- Se rodrigo.ferreira NÃO existe em auth.users:
-- Criá-lo PRIMEIRO via um dos métodos abaixo:
--
-- OPÇÃO A: Supabase Dashboard > Authentication > Add User
--   email: rodrigo.ferreira@ypoti.local
--   password: (temporário, forçar troca)
--
-- OPÇÃO B: Via Edge Function admin-users (se o app estiver rodando):
--   POST /functions/v1/admin-users
--   { action: "create", email: "rodrigo.ferreira@ypoti.local",
--     name: "Rodrigo Ferreira", role: "gerente",
--     establishment: "Ypoti" }
--
-- Depois rodar este script novamente.
-- ============================================================

-- VERIFICAÇÃO:
SELECT username, name, role, can_approve, active
FROM profiles
WHERE username = 'rodrigo.ferreira';
