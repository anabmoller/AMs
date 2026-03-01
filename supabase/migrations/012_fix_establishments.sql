-- ============================================================
-- MIGRATION 012: Sincronizar establishments com código
-- Date: 2026-03-01
-- Fix manager field to use short usernames.
-- Add "General" establishment.
-- ============================================================

-- 1) Corrigir manager field para usar usernames curtos
UPDATE establishments SET manager = 'fabiano'
WHERE manager = 'fabiano.squeruque';

UPDATE establishments SET manager = 'pedro'
WHERE manager = 'pedro.moller';

UPDATE establishments SET manager = 'paulo'
WHERE manager = 'paulo.becker';

-- 2) Adicionar "General" se não existe
INSERT INTO establishments (name, code, manager, active)
VALUES ('General', 'GEN', 'ronei', true)
ON CONFLICT DO NOTHING;

-- NOTE: "Santa Maria" stays as-is in DB.
-- The frontend code (approvalConfig.js) is being updated to use
-- "Santa Maria" instead of "Santa Maria da Serra".

-- VERIFICAÇÃO:
SELECT name, code, manager, active
FROM establishments
ORDER BY name;
