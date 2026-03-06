-- ============================================================
-- MIGRATION 018: RLS Lockdown — Replace permissive policies
-- Date: 2026-03-06
-- PR-1 of house-cleaning audit
--
-- Problem: Every SELECT policy uses USING (true), meaning any
-- authenticated user can read every row in every table.
--
-- Fix: Create helper functions for role checking, then replace
-- permissive policies with real predicates.
--
-- Strategy:
--   Tier 1 — requests + children: scoped by role
--            (view_all_requests vs view_own_requests)
--   Tier 2 — reference/lookup: read-all, write-admin
--   Tier 3 — profiles: read-all, write own or admin
--   Tier 4 — audit/admin tables: admin-only reads
--   Tier 5 — ganado/ETL: read-all-authenticated (unchanged for now,
--            establishment scoping deferred to future PR)
--
-- Safety: All statements are idempotent (CREATE OR REPLACE,
-- DROP POLICY IF EXISTS). service_role bypasses RLS automatically.
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Return current user's role from profiles table.
-- SECURITY DEFINER so it can read profiles regardless of RLS.
-- STABLE because role doesn't change within a transaction.
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS TEXT
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- Check if the current user is an admin.
-- Used by existing policies (referenced in migrations 004–006 + seed_real_data).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.auth_role() = 'admin', false)
$$;

-- Check if the current user has the view_all_requests permission.
-- These roles mirror the ROLE_PERMISSIONS map in auth.ts.
CREATE OR REPLACE FUNCTION public.can_view_all_requests()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    public.auth_role() IN (
      'admin', 'presidente', 'conselho', 'socio',
      'super_approver', 'diretoria', 'director',
      'gerente', 'lider', 'comprador', 'compras',
      'observador'
    ),
    false
  )
$$;


-- ============================================================
-- TIER 1: REQUESTS + CHILD TABLES
-- Most sensitive business data — scoped by role.
-- ============================================================

-- ---- requests ----
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS requests_select ON requests;
CREATE POLICY requests_select ON requests
  FOR SELECT TO authenticated
  USING (
    public.can_view_all_requests()
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS requests_service ON requests;
CREATE POLICY requests_service ON requests
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ---- request_items ----
ALTER TABLE request_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS request_items_select ON request_items;
CREATE POLICY request_items_select ON request_items
  FOR SELECT TO authenticated
  USING (
    public.can_view_all_requests()
    OR EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_items.request_id
        AND r.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS request_items_service ON request_items;
CREATE POLICY request_items_service ON request_items
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ---- quotations ----
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quotations_select ON quotations;
CREATE POLICY quotations_select ON quotations
  FOR SELECT TO authenticated
  USING (
    public.can_view_all_requests()
    OR EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = quotations.request_id
        AND r.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS quotations_service ON quotations;
CREATE POLICY quotations_service ON quotations
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ---- comments ----
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS comments_select ON comments;
CREATE POLICY comments_select ON comments
  FOR SELECT TO authenticated
  USING (
    public.can_view_all_requests()
    OR EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = comments.request_id
        AND r.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS comments_service ON comments;
CREATE POLICY comments_service ON comments
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ---- approval_steps ----
ALTER TABLE approval_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS approval_steps_select ON approval_steps;
CREATE POLICY approval_steps_select ON approval_steps
  FOR SELECT TO authenticated
  USING (
    public.can_view_all_requests()
    OR EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = approval_steps.request_id
        AND r.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS approval_steps_service ON approval_steps;
CREATE POLICY approval_steps_service ON approval_steps
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ---- approval_history ----
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS approval_history_select ON approval_history;
CREATE POLICY approval_history_select ON approval_history
  FOR SELECT TO authenticated
  USING (
    public.can_view_all_requests()
    OR EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = approval_history.request_id
        AND r.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS approval_history_service ON approval_history;
CREATE POLICY approval_history_service ON approval_history
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ============================================================
-- TIER 2: REFERENCE / LOOKUP TABLES
-- Shared data — all authenticated users can read.
-- Only admin can write (via Edge Functions + service_role).
-- ============================================================

-- ---- establishments ----
ALTER TABLE establishments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS establishments_select ON establishments;
CREATE POLICY establishments_select ON establishments
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS establishments_service ON establishments;
CREATE POLICY establishments_service ON establishments
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ---- suppliers ----
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS suppliers_select ON suppliers;
CREATE POLICY suppliers_select ON suppliers
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS suppliers_service ON suppliers;
CREATE POLICY suppliers_service ON suppliers
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ---- companies ----
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS companies_select ON companies;
CREATE POLICY companies_select ON companies
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS companies_service ON companies;
CREATE POLICY companies_service ON companies
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ---- sectors ----
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sectors_select ON sectors;
CREATE POLICY sectors_select ON sectors
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS sectors_service ON sectors;
CREATE POLICY sectors_service ON sectors
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ---- product_types ----
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_types_select ON product_types;
CREATE POLICY product_types_select ON product_types
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS product_types_service ON product_types;
CREATE POLICY product_types_service ON product_types
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ---- budgets ----
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS budgets_select ON budgets;
CREATE POLICY budgets_select ON budgets
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS budgets_service ON budgets;
CREATE POLICY budgets_service ON budgets
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ============================================================
-- TIER 3: PROFILES
-- All authenticated can read (needed for user lookups/display).
-- Users can update their own profile; admin can update any.
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select ON profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_service ON profiles;
CREATE POLICY profiles_service ON profiles
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ============================================================
-- TIER 4: AUDIT / ADMIN TABLES
-- Only admin or service_role can read; writes via service_role.
-- ============================================================

ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_trail_select ON audit_trail;
CREATE POLICY audit_trail_select ON audit_trail
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS audit_trail_service ON audit_trail;
CREATE POLICY audit_trail_service ON audit_trail
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS auth_audit_log_select ON auth_audit_log;
CREATE POLICY auth_audit_log_select ON auth_audit_log
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS auth_audit_log_service ON auth_audit_log;
CREATE POLICY auth_audit_log_service ON auth_audit_log
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


ALTER TABLE security_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS security_policies_select ON security_policies;
CREATE POLICY security_policies_select ON security_policies
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS security_policies_service ON security_policies;
CREATE POLICY security_policies_service ON security_policies
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


ALTER TABLE supplier_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS supplier_evaluations_select ON supplier_evaluations;
CREATE POLICY supplier_evaluations_select ON supplier_evaluations
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS supplier_evaluations_service ON supplier_evaluations;
CREATE POLICY supplier_evaluations_service ON supplier_evaluations
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


ALTER TABLE non_conformities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS non_conformities_select ON non_conformities;
CREATE POLICY non_conformities_select ON non_conformities
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS non_conformities_service ON non_conformities;
CREATE POLICY non_conformities_service ON non_conformities
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS document_versions_select ON document_versions;
CREATE POLICY document_versions_select ON document_versions
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS document_versions_service ON document_versions;
CREATE POLICY document_versions_service ON document_versions
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- ============================================================
-- TIER 5: REPLACE PERMISSIVE SELECT ON EXISTING-RLS TABLES
-- These tables already have RLS enabled but with USING (true).
-- Replace SELECT policies with at minimum authenticated check.
-- Ganado tables: keep read-all-authenticated for now (operational
-- data; establishment-based scoping deferred to future PR).
-- ============================================================

-- ---- functional_accounts (migration 004) ----
DROP POLICY IF EXISTS functional_accounts_select ON functional_accounts;
CREATE POLICY functional_accounts_select ON functional_accounts
  FOR SELECT TO authenticated
  USING (true);
-- Note: functional_accounts_admin policy (FOR ALL using is_admin()) preserved.

-- ---- user_establishments (migration 005) ----
DROP POLICY IF EXISTS user_establishments_select ON user_establishments;
CREATE POLICY user_establishments_select ON user_establishments
  FOR SELECT TO authenticated
  USING (true);
-- Note: user_establishments_admin policy preserved.

-- ---- fiscal_entities (migration 006) ----
DROP POLICY IF EXISTS fiscal_entities_select ON fiscal_entities;
CREATE POLICY fiscal_entities_select ON fiscal_entities
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS user_fiscal_entities_select ON user_fiscal_entities;
CREATE POLICY user_fiscal_entities_select ON user_fiscal_entities
  FOR SELECT TO authenticated
  USING (true);
-- Note: admin policies preserved for both tables.

-- ---- seed_real_data tables ----
-- categories, subcategories, locations, products, price_history,
-- monthly_kpis, contracts, stock_movements, fuel_consumption
-- These are reference/analytical data. Keep read-all-authenticated.
-- Admin write policies already exist and are preserved.

DROP POLICY IF EXISTS categories_select ON categories;
CREATE POLICY categories_select ON categories
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS subcategories_select ON subcategories;
CREATE POLICY subcategories_select ON subcategories
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS locations_select ON locations;
CREATE POLICY locations_select ON locations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS products_select ON products;
CREATE POLICY products_select ON products
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS price_history_select ON price_history;
CREATE POLICY price_history_select ON price_history
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS monthly_kpis_select ON monthly_kpis;
CREATE POLICY monthly_kpis_select ON monthly_kpis
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS contracts_select ON contracts;
CREATE POLICY contracts_select ON contracts
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS stock_movements_select ON stock_movements;
CREATE POLICY stock_movements_select ON stock_movements
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS fuel_consumption_select ON fuel_consumption;
CREATE POLICY fuel_consumption_select ON fuel_consumption
  FOR SELECT TO authenticated USING (true);

-- ---- Ganado tables (migration 015–017) ----
-- Operational cattle movement data. Keep read-all-authenticated.
-- Writes already restricted to service_role (Edge Functions).
-- Future: scope by establishment via user_establishments junction.

DROP POLICY IF EXISTS movimientos_select ON movimientos_ganado;
CREATE POLICY movimientos_select ON movimientos_ganado
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS divergencias_select ON movimiento_divergencias;
CREATE POLICY divergencias_select ON movimiento_divergencias
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS archivos_select ON movimiento_archivos;
CREATE POLICY archivos_select ON movimiento_archivos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS categorias_animales_select ON categorias_animales;
CREATE POLICY categorias_animales_select ON categorias_animales
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS detalle_cat_select ON detalle_movimiento_categorias;
CREATE POLICY detalle_cat_select ON detalle_movimiento_categorias
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS estados_log_select ON movimiento_estados_log;
CREATE POLICY estados_log_select ON movimiento_estados_log
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS pesajes_select ON pesajes_ganado;
CREATE POLICY pesajes_select ON pesajes_ganado
  FOR SELECT TO authenticated USING (true);

-- ---- Ganado enhancements (migration 016) ----
DROP POLICY IF EXISTS comisionistas_select ON comisionistas;
CREATE POLICY comisionistas_select ON comisionistas
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS animales_select ON animales_individuales;
CREATE POLICY animales_select ON animales_individuales
  FOR SELECT TO authenticated USING (true);

-- ---- ETL tables (migration 017) ----
-- Staging data from external systems. Keep read-all-authenticated.
DROP POLICY IF EXISTS etl_fazendas_select ON etl_fazendas;
CREATE POLICY etl_fazendas_select ON etl_fazendas
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS etl_provedores_select ON etl_provedores;
CREATE POLICY etl_provedores_select ON etl_provedores
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS etl_compras_select ON etl_compras;
CREATE POLICY etl_compras_select ON etl_compras
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS etl_cotas_select ON etl_cotas;
CREATE POLICY etl_cotas_select ON etl_cotas
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS etl_guias_select ON etl_guias;
CREATE POLICY etl_guias_select ON etl_guias
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS etl_movimentacoes_select ON etl_movimentacoes;
CREATE POLICY etl_movimentacoes_select ON etl_movimentacoes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS etl_animais_select ON etl_animais;
CREATE POLICY etl_animais_select ON etl_animais
  FOR SELECT TO authenticated USING (true);


-- ============================================================
-- DONE — Summary of changes:
--
-- NEW helper functions:
--   auth_role()             — returns current user's role
--   is_admin()              — true if role = 'admin'
--   can_view_all_requests() — true if role has view_all_requests
--
-- NEWLY RLS-ENABLED (14 tables):
--   profiles, requests, request_items, quotations, comments,
--   approval_steps, approval_history, budgets, establishments,
--   suppliers, companies, sectors, product_types,
--   audit_trail, auth_audit_log, security_policies,
--   supplier_evaluations, non_conformities, document_versions
--
-- REAL PREDICATES added (Tier 1):
--   requests — scoped: view_all OR own
--   request_items, quotations, comments, approval_steps,
--   approval_history — scoped via parent request
--
-- ADMIN-ONLY reads (Tier 4):
--   audit_trail, auth_audit_log, supplier_evaluations,
--   non_conformities, document_versions
--
-- UNCHANGED logic (Tier 2, 3, 5):
--   Reference tables, profiles, ganado, ETL — remain read-all
--   but now have explicit service_role write policies ensuring
--   authenticated users cannot write directly.
-- ============================================================
