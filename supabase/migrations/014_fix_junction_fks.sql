-- ============================================================
-- MIGRATION 014: Redirecionar junction tables FK → profiles
-- Date: 2026-03-01
-- Depends on: 013 (users table dropped, junction FKs removed)
-- ============================================================

-- 1) user_establishments: recreate FK to profiles
-- The CASCADE in 013 removed the old FK to users.
-- Now add FK to profiles.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_establishments_user_id_fkey'
      AND table_name = 'user_establishments'
  ) THEN
    ALTER TABLE user_establishments
      ADD CONSTRAINT user_establishments_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'user_establishments FK: %', SQLERRM;
END $$;

-- 2) user_fiscal_entities: recreate FK to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_fiscal_entities_user_id_fkey'
      AND table_name = 'user_fiscal_entities'
  ) THEN
    ALTER TABLE user_fiscal_entities
      ADD CONSTRAINT user_fiscal_entities_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'user_fiscal_entities FK: %', SQLERRM;
END $$;

-- 3) Update v_users_with_entities to use proper junction
CREATE OR REPLACE VIEW v_users_with_entities AS
SELECT
  p.id, p.username, p.name, p.role,
  fe.legal_name AS fiscal_entity,
  fe.ruc,
  ufe.is_default AS is_default_entity
FROM profiles p
LEFT JOIN user_fiscal_entities ufe ON p.id = ufe.user_id
LEFT JOIN fiscal_entities fe ON ufe.fiscal_entity_id = fe.id
WHERE p.active = true;

-- VERIFICAÇÃO:
SELECT tc.table_name, tc.constraint_name, ccu.table_name AS references_table
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('user_establishments', 'user_fiscal_entities')
ORDER BY tc.table_name;
