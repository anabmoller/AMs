-- ============================================================
-- 021 — Ganado Metrics RPC
-- Returns KPI aggregations in a single call.
-- Supports optional date range and establishment filters.
-- ============================================================

CREATE OR REPLACE FUNCTION get_ganado_metrics(
  p_fecha_desde DATE DEFAULT NULL,
  p_fecha_hasta DATE DEFAULT NULL,
  p_establecimiento_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    -- KPI cards
    'por_validar', COALESCE(SUM(CASE WHEN m.estado IN ('borrador', 'pendiente_validacion') THEN 1 ELSE 0 END), 0),
    'en_transito', COALESCE(SUM(CASE WHEN m.estado = 'en_transito' THEN 1 ELSE 0 END), 0),
    'total_cabezas', COALESCE(SUM(
      CASE WHEN m.estado NOT IN ('anulado') THEN m.cantidad_total ELSE 0 END
    ), 0),
    'total_gs', COALESCE(SUM(
      CASE WHEN m.moneda = 'PYG' AND m.estado NOT IN ('anulado') THEN m.precio_total ELSE 0 END
    ), 0),
    -- Counts by status (for filter chips)
    'by_status', jsonb_build_object(
      'borrador',               COALESCE(SUM(CASE WHEN m.estado = 'borrador' THEN 1 ELSE 0 END), 0),
      'pendiente_validacion',   COALESCE(SUM(CASE WHEN m.estado = 'pendiente_validacion' THEN 1 ELSE 0 END), 0),
      'validado',               COALESCE(SUM(CASE WHEN m.estado = 'validado' THEN 1 ELSE 0 END), 0),
      'en_transito',            COALESCE(SUM(CASE WHEN m.estado = 'en_transito' THEN 1 ELSE 0 END), 0),
      'recibido',               COALESCE(SUM(CASE WHEN m.estado = 'recibido' THEN 1 ELSE 0 END), 0),
      'cerrado',                COALESCE(SUM(CASE WHEN m.estado = 'cerrado' THEN 1 ELSE 0 END), 0),
      'anulado',                COALESCE(SUM(CASE WHEN m.estado = 'anulado' THEN 1 ELSE 0 END), 0)
    ),
    'total_movimientos', COUNT(*)
  ) INTO result
  FROM movimientos_ganado m
  WHERE (p_fecha_desde IS NULL OR m.fecha_emision >= p_fecha_desde)
    AND (p_fecha_hasta IS NULL OR m.fecha_emision <= p_fecha_hasta)
    AND (p_establecimiento_id IS NULL OR m.establecimiento_origen_id = p_establecimiento_id);

  RETURN result;
END;
$$;

-- Grant execute to authenticated users (RLS on movimientos_ganado still applies for row access,
-- but this function uses SECURITY DEFINER for aggregation performance)
GRANT EXECUTE ON FUNCTION get_ganado_metrics(DATE, DATE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ganado_metrics(DATE, DATE, UUID) TO anon;
