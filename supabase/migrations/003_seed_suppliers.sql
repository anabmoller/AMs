-- ============================================================
-- MIGRATION 003: Seed Suppliers — Compras Ypoti
-- Date: 2026-03-01
-- Purpose: Insert 29 Paraguayan suppliers across key categories
--          (Insumos Agrícolas, Combustible, Repuestos/Maquinaria,
--           Veterinaria, Nutrición Animal, Ferretería, etc.)
-- ============================================================

INSERT INTO suppliers (name, ruc, category, city, phone, email, active) VALUES
  -- Insumos Agrícolas
  ('Agrofertil S.A.',           '80004321-0', 'Insumos Agrícolas',      'Asunción',        '(021) 518-5000', 'ventas@agrofertil.com.py',       true),
  ('Dekalpar S.A.',             '80007654-3', 'Insumos Agrícolas',      'Ciudad del Este',  '(061) 573-200',  'info@dekalpar.com.py',           true),
  ('Agro Santa Rosa',           '80012345-6', 'Insumos Agrícolas',      'Santa Rosa',       '(0858) 232-100', 'contacto@agrosantarosa.com.py',  true),

  -- Combustible
  ('Petrobras Paraguay',        '80098765-4', 'Combustible',            'Asunción',        '(021) 416-6000', 'comercial@petrobras.com.py',     true),
  ('Copetrol S.A.',             '80045678-1', 'Combustible',            'Asunción',        '(021) 219-3000', 'ventas@copetrol.com.py',         true),
  ('Puma Energy',               '80034567-2', 'Combustible',            'Asunción',        '(021) 617-8000', 'info@pumaenergy.com.py',         true),

  -- Repuestos / Maquinaria
  ('Reimport S.A.',             '80056789-0', 'Repuestos/Maquinaria',   'Asunción',        '(021) 645-2000', 'repuestos@reimport.com.py',      true),
  ('Ciabay',                    '80067890-3', 'Repuestos/Maquinaria',   'Asunción',        '(021) 500-7000', 'ventas@ciabay.com.py',           true),

  -- Maquinaria Agrícola
  ('Rieder & Cia',              '80023456-5', 'Maquinaria Agrícola',    'Loma Plata',      '(0491) 252-200', 'info@rieder.com.py',             true),
  ('CASE IH',                   '80078901-6', 'Maquinaria Agrícola',    'Asunción',        '(021) 688-3000', 'caseih@caseih.com.py',           true),
  ('John Deere Paraguay',       '80089012-9', 'Maquinaria Agrícola',    'Asunción',        '(021) 662-1000', 'info@johndeere.com.py',          true),

  -- Veterinaria
  ('Laboratorios Rosenbusch',   '80090123-2', 'Veterinaria',            'Asunción',        '(021) 290-5000', 'info@rosenbusch.com.py',         true),
  ('MSD Salud Animal',          '80001234-7', 'Veterinaria',            'Asunción',        '(021) 610-8000', 'contacto@msd-animal.com.py',     true),
  ('Zoetis Paraguay',           '80002345-8', 'Veterinaria',            'Asunción',        '(021) 614-9000', 'info@zoetis.com.py',             true),
  ('Biovet S.A.',               '80003456-9', 'Veterinaria',            'Asunción',        '(021) 555-3200', 'ventas@biovet.com.py',           true),

  -- Nutrición Animal
  ('Maltería Paraguaya',        '80011234-5', 'Nutrición Animal',       'Asunción',        '(021) 530-2000', 'ventas@malteria.com.py',         true),
  ('ADM Paraguay',              '80022345-6', 'Nutrición Animal',       'Asunción',        '(021) 617-4000', 'info@adm.com.py',                true),
  ('Cargill Paraguay',          '80033456-7', 'Nutrición Animal',       'Asunción',        '(021) 616-5000', 'contacto@cargill.com.py',        true),
  ('Cooperativa Chortitzer',    '80044567-8', 'Nutrición Animal',       'Loma Plata',      '(0491) 417-100', 'info@chortitzer.com.py',         true),

  -- Ferretería
  ('Ferretería Industrial',     '80055678-9', 'Ferretería',             'Asunción',        '(021) 445-6700', 'ventas@ferreteriaindustrial.com.py', true),

  -- Aceros / Construcción
  ('Acepar S.A.',               '80066789-0', 'Aceros/Construcción',    'Villeta',         '(0225) 272-100', 'ventas@acepar.com.py',           true),

  -- Materiales
  ('Tubopar',                   '80077890-1', 'Materiales',             'Asunción',        '(021) 558-2000', 'info@tubopar.com.py',            true),

  -- Electrónica / TI
  ('Electroban',                '80088901-2', 'Electrónica/TI',         'Asunción',        '(021) 411-8000', 'ventas@electroban.com.py',       true),

  -- Equipamiento
  ('Salemma',                   '80099012-3', 'Equipamiento',           'Asunción',        '(021) 618-5000', 'info@salemma.com.py',            true),

  -- Provistas / Mercadería
  ('Grupo Vázquez',             '80000123-4', 'Provistas/Mercadería',   'Asunción',        '(021) 440-9000', 'pedidos@grupovazquez.com.py',    true),
  ('Stock S.A.',                '80010234-5', 'Provistas/Mercadería',   'Asunción',        '(021) 419-1000', 'comercial@stock.com.py',         true),

  -- Materiales Construcción
  ('Tape Ruvicha',              '80020345-6', 'Materiales Construcción', 'Asunción',       '(021) 520-1000', 'ventas@taperuvicha.com.py',      true),

  -- Vehículos / Repuestos
  ('Toyotoshi',                 '80030456-7', 'Vehículos/Repuestos',    'Asunción',        '(021) 619-3000', 'ventas@toyotoshi.com.py',        true),

  -- Maquinaria / Vehículos
  ('Automaq SAECA',             '80040567-8', 'Maquinaria/Vehículos',   'Asunción',        '(021) 689-7000', 'info@automaq.com.py',            true)

ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- VERIFICATION
-- ============================================================
DO $$
DECLARE
  cnt INTEGER;
BEGIN
  SELECT count(*) INTO cnt FROM suppliers;
  RAISE NOTICE '--- 003_seed_suppliers.sql applied successfully ---';
  RAISE NOTICE 'Total suppliers in table: %', cnt;
END $$;
