/**
 * AnalysisScreen — Bloomberg Terminal-style dark analytics dashboard
 * 5 tabs, 12 Recharts charts, hardcoded data, emerald accents
 */
import { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Scatter, ScatterChart, Treemap
} from 'recharts';
import Card from '../shared/Card';
import Badge from '../shared/Badge';

/* ------------------------------------------------------------------ */
/*  PALETTE                                                            */
/* ------------------------------------------------------------------ */
const C = {
  emerald: '#10b981', emeraldDim: '#059669',
  blue: '#3b82f6', blueDim: '#2563eb',
  amber: '#f59e0b', amberDim: '#d97706',
  red: '#ef4444', redDim: '#dc2626',
  purple: '#8b5cf6', purpleDim: '#7c3aed',
  cyan: '#06b6d4',
  orange: '#f97316',
  pink: '#ec4899',
  slate: '#64748b',
};

const TABS = [
  { key: 'resumen', label: 'Resumen Ejecutivo' },
  { key: 'precios', label: 'Precios & Tendencias' },
  { key: 'proveedores', label: 'Proveedores & Riesgo' },
  { key: 'oportunidades', label: 'Oportunidades' },
  { key: 'workflow', label: 'Workflow & Plan' },
];

const GRID = 'rgba(255,255,255,0.05)';
const TICK = { fill: '#94a3b8', fontSize: 10 };
const TICK_DIM = { fill: '#64748b', fontSize: 10 };

/* ------------------------------------------------------------------ */
/*  DARK TOOLTIP                                                       */
/* ------------------------------------------------------------------ */
function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1b23] border border-white/10 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-400 mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CHART CARD                                                         */
/* ------------------------------------------------------------------ */
function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <Card hover={false} className={`p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  TREEMAP CUSTOM CONTENT                                             */
/* ------------------------------------------------------------------ */
function TreemapContent({ x, y, width, height, name, ahorro, fill }) {
  if (width < 50 || height < 30) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={4} fill={fill} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
      <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#fff" fontSize={10} fontWeight={600}>
        {name?.length > 18 ? name.slice(0, 16) + '...' : name}
      </text>
      <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={9}>
        Gs {ahorro}M
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  LEGEND FORMATTER                                                   */
/* ------------------------------------------------------------------ */
const legendFmt = (v) => <span className="text-xs text-slate-400">{v}</span>;

/* ================================================================== */
/*  TAB 1 — RESUMEN EJECUTIVO                                         */
/* ================================================================== */
function ResumenTab() {
  const monthlyPurchases = useMemo(() => [
    { mes: 'Ene', compras: 980 },  { mes: 'Feb', compras: 1120 },
    { mes: 'Mar', compras: 1340 },  { mes: 'Abr', compras: 1050 },
    { mes: 'May', compras: 890 },   { mes: 'Jun', compras: 760 },
    { mes: 'Jul', compras: 820 },   { mes: 'Ago', compras: 1010 },
    { mes: 'Sep', compras: 1180 },  { mes: 'Oct', compras: 1250 },
    { mes: 'Nov', compras: 1340 },  { mes: 'Dic', compras: 1107 },
  ], []);

  const categoryDist = useMemo(() => [
    { name: 'Veterinaria', value: 35, color: C.emerald },
    { name: 'Nutricion', value: 25, color: C.blue },
    { name: 'Mantenimiento', value: 15, color: C.amber },
    { name: 'Combustible', value: 12, color: C.orange },
    { name: 'Agricola', value: 8, color: C.purple },
    { name: 'Operacional', value: 5, color: C.cyan },
  ], []);

  const kpis = useMemo(() => [
    { label: 'Total Compras YTD', value: 'Gs 12.847M', color: C.emerald, accent: 'border-l-emerald-500' },
    { label: 'Ahorro Negociado', value: 'Gs 2.340M', sub: '18.2%', color: C.blue, accent: 'border-l-blue-500' },
    { label: 'Proveedores Activos', value: '29', color: C.purple, accent: 'border-l-purple-500' },
    { label: 'Lead Time Promedio', value: '14 dias', color: C.amber, accent: 'border-l-amber-500' },
    { label: 'Compliance ISO', value: '67%', color: C.red, accent: 'border-l-red-500' },
    { label: 'Solicitudes Mes', value: '23', color: C.cyan, accent: 'border-l-cyan-500' },
  ], []);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} hover={false} className={`p-4 border-l-2 ${k.accent}`}>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{k.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: k.color }}>{k.value}</p>
            {k.sub && <Badge variant="success" size="xs" className="mt-1">{k.sub}</Badge>}
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart 1 — Monthly Purchases Bar */}
        <ChartCard title="Compras Mensuales 2026" subtitle="Gs millones por mes">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyPurchases}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="mes" tick={TICK} />
              <YAxis tick={TICK_DIM} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="compras" name="Compras (Gs M)" radius={[4, 4, 0, 0]}>
                {monthlyPurchases.map((_, i) => (
                  <Cell key={i} fill={i < 3 ? C.emerald : C.emeraldDim} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        {/* Chart 2 — Category Pie */}
        <ChartCard title="Distribucion por Categoria" subtitle="% del total de compras">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryDist} dataKey="value" nameKey="name" cx="50%" cy="50%"
                outerRadius={85} innerRadius={48} paddingAngle={3} strokeWidth={0}>
                {categoryDist.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip content={<DarkTooltip />} />
              <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  TAB 2 — PRECIOS & TENDENCIAS                                      */
/* ================================================================== */
function PreciosTab() {
  const cattlePrices = useMemo(() => [
    { period: 'Q1 22', usd: 1.82 }, { period: 'Q2 22', usd: 1.88 },
    { period: 'Q3 22', usd: 1.95 }, { period: 'Q4 22', usd: 1.90 },
    { period: 'Q1 23', usd: 1.96 }, { period: 'Q2 23', usd: 2.04 },
    { period: 'Q3 23', usd: 1.98 }, { period: 'Q4 23', usd: 2.08 },
    { period: 'Q1 24', usd: 2.12 }, { period: 'Q2 24', usd: 2.18 },
    { period: 'Q3 24', usd: 2.10 }, { period: 'Q4 24', usd: 2.15 },
    { period: 'Q1 25', usd: 2.20 }, { period: 'Q2 25', usd: 2.28 },
    { period: 'Q3 25', usd: 2.22 }, { period: 'Q4 25', usd: 2.30 },
    { period: 'Q1 26', usd: 2.35 },
  ], []);

  const rawMaterials = useMemo(() => [
    { period: 'Q1 23', maiz: 205, soja: 510, sorgo: 185 },
    { period: 'Q2 23', maiz: 195, soja: 490, sorgo: 175 },
    { period: 'Q3 23', maiz: 188, soja: 475, sorgo: 168 },
    { period: 'Q4 23', maiz: 198, soja: 495, sorgo: 178 },
    { period: 'Q1 24', maiz: 210, soja: 520, sorgo: 190 },
    { period: 'Q2 24', maiz: 200, soja: 505, sorgo: 182 },
    { period: 'Q3 24', maiz: 192, soja: 488, sorgo: 172 },
    { period: 'Q4 24', maiz: 205, soja: 510, sorgo: 185 },
    { period: 'Q1 25', maiz: 215, soja: 530, sorgo: 195 },
    { period: 'Q2 25', maiz: 208, soja: 515, sorgo: 188 },
    { period: 'Q3 25', maiz: 198, soja: 498, sorgo: 178 },
    { period: 'Q4 25', maiz: 212, soja: 525, sorgo: 192 },
    { period: 'Q1 26', maiz: 220, soja: 540, sorgo: 200 },
  ], []);

  const fuelComparison = useMemo(() => [
    { proveedor: 'Copetrol', diesel: 8320, nafta: 8950 },
    { proveedor: 'Petropar', diesel: 8180, nafta: 8780 },
    { proveedor: 'Puma', diesel: 8500, nafta: 9100 },
  ], []);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Chart 3 — Cattle Price Line */}
      <ChartCard title="Evolucion Precio Novillo Gordo" subtitle="USD/kg — 2022-2026, tendencia alcista con estacionalidad">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={cattlePrices}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="period" tick={TICK} interval={2} />
            <YAxis tick={TICK_DIM} domain={[1.75, 2.40]} tickFormatter={(v) => v.toFixed(2)} />
            <Tooltip content={<DarkTooltip />} />
            <Line type="monotone" dataKey="usd" name="USD/kg" stroke={C.emerald}
              strokeWidth={2.5} dot={{ r: 3, fill: C.emerald }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      {/* Chart 4 — Raw Materials Area */}
      <ChartCard title="Precios Materias Primas" subtitle="USD/ton — Maiz, Soja, Sorgo (2023-2026)">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={rawMaterials}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="period" tick={TICK} interval={2} />
            <YAxis tick={TICK_DIM} />
            <Tooltip content={<DarkTooltip />} />
            <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
            <Area type="monotone" dataKey="soja" name="Soja" stroke={C.amber}
              fill={C.amber} fillOpacity={0.08} strokeWidth={2} />
            <Area type="monotone" dataKey="maiz" name="Maiz" stroke={C.emerald}
              fill={C.emerald} fillOpacity={0.08} strokeWidth={2} />
            <Area type="monotone" dataKey="sorgo" name="Sorgo" stroke={C.purple}
              fill={C.purple} fillOpacity={0.08} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      {/* Chart 5 — Fuel Comparison Bar */}
      <ChartCard title="Diesel vs Nafta por Proveedor" subtitle="Gs/litro — Comparativa actual">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={fuelComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="proveedor" tick={TICK} />
            <YAxis tick={TICK_DIM} domain={[7500, 9500]} />
            <Tooltip content={<DarkTooltip />} />
            <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
            <Bar dataKey="diesel" name="Diesel" fill={C.blue} radius={[4, 4, 0, 0]} barSize={32} />
            <Bar dataKey="nafta" name="Nafta" fill={C.orange} radius={[4, 4, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

/* ================================================================== */
/*  TAB 3 — PROVEEDORES & RIESGO                                      */
/* ================================================================== */
function ProveedoresTab() {
  const radarData = useMemo(() => [
    { axis: 'Calidad', Agrofertil: 88, Dekalpar: 82, Ciabay: 78 },
    { axis: 'Entrega', Agrofertil: 75, Dekalpar: 90, Ciabay: 85 },
    { axis: 'Precio', Agrofertil: 70, Dekalpar: 85, Ciabay: 92 },
    { axis: 'Compliance', Agrofertil: 92, Dekalpar: 80, Ciabay: 74 },
    { axis: 'Servicio', Agrofertil: 82, Dekalpar: 78, Ciabay: 80 },
  ], []);

  const topSuppliers = useMemo(() => [
    { name: 'Agrofertil', volumen: 5140 },
    { name: 'Cargill', volumen: 2820 },
    { name: 'ADM', volumen: 2450 },
    { name: 'Dekalpar', volumen: 1980 },
    { name: 'Petrobras', volumen: 1750 },
    { name: 'Ciabay', volumen: 1420 },
    { name: 'Copetrol', volumen: 1180 },
    { name: 'Rosenbusch', volumen: 980 },
    { name: 'MSD Animal', volumen: 820 },
    { name: 'Rieder', volumen: 650 },
  ], []);

  const riskTable = useMemo(() => [
    { producto: 'Maiz humedo', proveedor: 'Agrofertil', pct: 78, alternativas: 2, riesgo: 'CRITICO' },
    { producto: 'Burlanda (DDGS)', proveedor: 'Agrofertil', pct: 65, alternativas: 3, riesgo: 'ALTO' },
    { producto: 'Vacuna Aftosa', proveedor: 'Rosenbusch', pct: 85, alternativas: 1, riesgo: 'CRITICO' },
    { producto: 'Calcareo', proveedor: 'Sin definir', pct: 90, alternativas: 0, riesgo: 'CRITICO' },
    { producto: 'Diesel', proveedor: 'Petrobras', pct: 60, alternativas: 2, riesgo: 'MEDIO' },
    { producto: 'Sal marina', proveedor: 'Malteria', pct: 70, alternativas: 2, riesgo: 'ALTO' },
  ], []);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart 6 — Radar */}
        <ChartCard title="Evaluacion Top 3 Proveedores" subtitle="Agrofertil, Dekalpar, Ciabay — 5 ejes">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="axis" tick={TICK} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={TICK_DIM} />
              <Radar name="Agrofertil" dataKey="Agrofertil" stroke={C.emerald}
                fill={C.emerald} fillOpacity={0.12} strokeWidth={2} />
              <Radar name="Dekalpar" dataKey="Dekalpar" stroke={C.blue}
                fill={C.blue} fillOpacity={0.12} strokeWidth={2} />
              <Radar name="Ciabay" dataKey="Ciabay" stroke={C.amber}
                fill={C.amber} fillOpacity={0.12} strokeWidth={2} />
              <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
              <Tooltip content={<DarkTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
        {/* Chart 7 — Horizontal Bar Top 10 */}
        <ChartCard title="Top 10 Proveedores por Volumen" subtitle="Gs millones">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSuppliers} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis type="number" tick={TICK_DIM} />
              <YAxis type="category" dataKey="name" tick={TICK} width={75} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="volumen" name="Volumen (Gs M)" radius={[0, 4, 4, 0]}>
                {topSuppliers.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? C.emerald : i < 3 ? C.blue : C.slate} fillOpacity={i === 0 ? 1 : 0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      {/* Risk Table */}
      <ChartCard title="Productos con Proveedor Unico" subtitle="Dependencia Agrofertil 40% del total">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Producto', 'Proveedor', '% Compras', 'Alternativas', 'Riesgo'].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {riskTable.map((r, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                  <td className="py-2.5 px-3 text-white font-medium text-xs">{r.producto}</td>
                  <td className="py-2.5 px-3 text-slate-400 text-xs">{r.proveedor}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-white/[0.08]">
                        <div className="h-full rounded-full" style={{
                          width: `${r.pct}%`,
                          background: r.pct > 75 ? C.red : r.pct > 50 ? C.amber : C.emerald,
                        }} />
                      </div>
                      <span className="text-slate-300 text-xs">{r.pct}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-xs text-center">{r.alternativas}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant={r.riesgo === 'CRITICO' ? 'danger' : r.riesgo === 'ALTO' ? 'warning' : 'success'}
                      size="xs" dot>{r.riesgo}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

/* ================================================================== */
/*  TAB 4 — OPORTUNIDADES                                             */
/* ================================================================== */
function OportunidadesTab() {
  const savingsTree = useMemo(() => [
    { name: 'Maiz forward', ahorro: 850, fill: C.emerald },
    { name: 'Diesel contrato', ahorro: 620, fill: C.emeraldDim },
    { name: 'Burlanda alt.', ahorro: 480, fill: C.blue },
    { name: 'Vacunas consol.', ahorro: 350, fill: C.blueDim },
    { name: 'Sal importacion', ahorro: 280, fill: C.amber },
    { name: 'Calcareo coop.', ahorro: 220, fill: C.amberDim },
    { name: 'Nafta fleet', ahorro: 180, fill: C.purple },
    { name: 'Aceites semest.', ahorro: 150, fill: C.purpleDim },
    { name: 'Repuestos prev.', ahorro: 120, fill: C.cyan },
    { name: 'Semillas early', ahorro: 95, fill: C.orange },
    { name: 'Urea pool', ahorro: 85, fill: C.pink },
    { name: 'Herram. licit.', ahorro: 75, fill: C.red },
    { name: 'Cascarilla transp.', ahorro: 65, fill: C.redDim },
    { name: 'Abono timing', ahorro: 55, fill: C.slate },
    { name: 'Uniformes local', ahorro: 40, fill: '#475569' },
  ], []);

  const budgetVsActual = useMemo(() => [
    { estab: 'Ypoti Central', presupuesto: 4800, real: 5120 },
    { estab: 'Estancia Norte', presupuesto: 3200, real: 2980 },
    { estab: 'Feedlot Sur', presupuesto: 2600, real: 2850 },
    { estab: 'Campo Agricola', presupuesto: 1900, real: 1720 },
    { estab: 'Deposito Asuncion', presupuesto: 800, real: 910 },
  ], []);

  const q1Actions = useMemo(() => [
    { accion: 'Negociar forward maiz Agrofertil', ahorro: 'Gs 850M', prioridad: 'ALTA', estado: 'En curso' },
    { accion: 'Licitacion diesel anual (3 proveedores)', ahorro: 'Gs 620M', prioridad: 'ALTA', estado: 'Pendiente' },
    { accion: 'Evaluar proveedor alternativo burlanda', ahorro: 'Gs 480M', prioridad: 'ALTA', estado: 'Pendiente' },
    { accion: 'Compra consolidada vacunas Q1', ahorro: 'Gs 350M', prioridad: 'MEDIA', estado: 'Planificado' },
    { accion: 'Cotizar importacion directa sal marina', ahorro: 'Gs 280M', prioridad: 'MEDIA', estado: 'Pendiente' },
    { accion: 'Contactar Cooperativa Chortitzer calcareo', ahorro: 'Gs 220M', prioridad: 'MEDIA', estado: 'Pendiente' },
  ], []);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Chart 8 — Treemap */}
      <ChartCard title="Top 15 Oportunidades de Ahorro" subtitle="Por categoria de producto — tamano proporcional al ahorro">
        <ResponsiveContainer width="100%" height={320}>
          <Treemap data={savingsTree} dataKey="ahorro" nameKey="name"
            content={<TreemapContent />} animationDuration={400} />
        </ResponsiveContainer>
      </ChartCard>
      {/* Chart 9 — Budget vs Actual Bar */}
      <ChartCard title="Presupuesto vs Real por Establecimiento" subtitle="Gs millones — Q1 2026">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={budgetVsActual}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="estab" tick={{ ...TICK, fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={55} />
            <YAxis tick={TICK_DIM} />
            <Tooltip content={<DarkTooltip />} />
            <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
            <Bar dataKey="presupuesto" name="Presupuesto" fill={C.blue} radius={[4, 4, 0, 0]} barSize={28} fillOpacity={0.7} />
            <Bar dataKey="real" name="Real" fill={C.emerald} radius={[4, 4, 0, 0]} barSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      {/* Priority Actions Table */}
      <ChartCard title="Acciones Prioritarias Q1 2026" subtitle="Iniciativas de alto impacto">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Accion', 'Ahorro Est.', 'Prioridad', 'Estado'].map((h) => (
                  <th key={h} className="text-left py-2 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {q1Actions.map((a, i) => (
                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                  <td className="py-2.5 px-3 text-white text-xs font-medium">{a.accion}</td>
                  <td className="py-2.5 px-3 text-emerald-400 text-xs font-semibold">{a.ahorro}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant={a.prioridad === 'ALTA' ? 'danger' : 'warning'} size="xs">{a.prioridad}</Badge>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant={a.estado === 'En curso' ? 'success' : a.estado === 'Planificado' ? 'info' : 'default'}
                      size="xs" dot>{a.estado}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

/* ================================================================== */
/*  TAB 5 — WORKFLOW & PLAN                                            */
/* ================================================================== */
function WorkflowTab() {
  const processingTime = useMemo(() => [
    { mes: 'Jul', dias: 22 },  { mes: 'Ago', dias: 20 },
    { mes: 'Sep', dias: 18 },  { mes: 'Oct', dias: 19 },
    { mes: 'Nov', dias: 16 },  { mes: 'Dic', dias: 15 },
    { mes: 'Ene', dias: 14 },  { mes: 'Feb', dias: 13 },
  ], []);

  const requestVolume = useMemo(() => [
    { mes: 'Jul', aprobada: 12, pendiente: 5, rechazada: 2 },
    { mes: 'Ago', aprobada: 15, pendiente: 4, rechazada: 1 },
    { mes: 'Sep', aprobada: 18, pendiente: 6, rechazada: 3 },
    { mes: 'Oct', aprobada: 14, pendiente: 8, rechazada: 2 },
    { mes: 'Nov', aprobada: 20, pendiente: 3, rechazada: 1 },
    { mes: 'Dic', aprobada: 16, pendiente: 7, rechazada: 4 },
    { mes: 'Ene', aprobada: 19, pendiente: 5, rechazada: 2 },
    { mes: 'Feb', aprobada: 23, pendiente: 4, rechazada: 1 },
  ], []);

  const roadmap = useMemo(() => [
    { q: 'Q1 2026', items: [
      'Negociar forward maiz con Agrofertil',
      'Contratar segundo proveedor DDGS',
      'Licitacion diesel anual',
      'Evaluar 5 nuevos proveedores',
    ]},
    { q: 'Q2 2026', items: [
      'Implementar scoring automatico',
      'Auditoria ISO 9001 proveedores top 5',
      'Pool de compra urea',
      'Early booking semillas invierno',
    ]},
    { q: 'Q3 2026', items: [
      'Revision semestral contratos',
      'Importacion directa sal marina',
      'Licitacion uniformes y EPP',
      'Optimizacion logistica interna',
    ]},
    { q: 'Q4 2026', items: [
      'Presupuesto 2027 basado en data',
      'Renegociacion anual contratos',
      'Certificacion ISO 9001 compras',
      'Dashboard predictivo ML',
    ]},
  ], []);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Chart 10 — Processing Time Area */}
        <ChartCard title="Tiempo de Procesamiento de Solicitudes" subtitle="Dias promedio para completar — tendencia descendente">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={processingTime}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="mes" tick={TICK} />
              <YAxis tick={TICK_DIM} domain={[0, 28]} />
              <Tooltip content={<DarkTooltip />} />
              <Area type="monotone" dataKey="dias" name="Dias" stroke={C.emerald}
                fill={C.emerald} fillOpacity={0.1} strokeWidth={2.5} dot={{ r: 3, fill: C.emerald }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        {/* Chart 11 — Stacked Bar Request Volume */}
        <ChartCard title="Volumen de Solicitudes por Estado" subtitle="Unidades por mes">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={requestVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="mes" tick={TICK} />
              <YAxis tick={TICK_DIM} />
              <Tooltip content={<DarkTooltip />} />
              <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
              <Bar dataKey="aprobada" name="Aprobada" stackId="a" fill={C.emerald} />
              <Bar dataKey="pendiente" name="Pendiente" stackId="a" fill={C.amber} />
              <Bar dataKey="rechazada" name="Rechazada" stackId="a" fill={C.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      {/* Chart 12 — Composed chart: volume + processing overlay */}
      <ChartCard title="Eficiencia Operativa" subtitle="Solicitudes totales vs tiempo de procesamiento">
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={requestVolume.map((r, i) => ({
            ...r,
            total: r.aprobada + r.pendiente + r.rechazada,
            dias: processingTime[i]?.dias ?? 0,
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="mes" tick={TICK} />
            <YAxis yAxisId="left" tick={TICK_DIM} />
            <YAxis yAxisId="right" orientation="right" tick={TICK_DIM} domain={[0, 30]} />
            <Tooltip content={<DarkTooltip />} />
            <Legend iconType="circle" iconSize={8} formatter={legendFmt} />
            <Bar yAxisId="left" dataKey="total" name="Solicitudes" fill={C.blue} fillOpacity={0.6} radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="dias" name="Dias promedio"
              stroke={C.emerald} strokeWidth={2.5} dot={{ r: 3, fill: C.emerald }} />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>
      {/* Roadmap Table */}
      <ChartCard title="Roadmap 2026" subtitle="Plan de accion Q1-Q4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roadmap.map((q) => (
            <Card key={q.q} hover={false} className="p-4">
              <h4 className="text-sm font-bold text-emerald-400 mb-3">{q.q}</h4>
              <ul className="space-y-2">
                {q.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="text-emerald-500 mt-0.5 shrink-0">●</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export default function AnalysisScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState('resumen');

  const tabContent = useMemo(() => ({
    resumen: <ResumenTab />,
    precios: <PreciosTab />,
    proveedores: <ProveedoresTab />,
    oportunidades: <OportunidadesTab />,
    workflow: <WorkflowTab />,
  }), []);

  return (
    <div className="min-h-screen bg-[#0a0b0f] pb-24">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <button onClick={onBack}
          className="text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors mb-3 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <h1 className="text-2xl font-bold text-white tracking-tight">Analisis Estrategico</h1>
        <p className="text-sm text-slate-500 mt-1">Dashboard ejecutivo — Bloomberg-style analytics</p>
      </div>

      {/* Tab Pills */}
      <div className="flex gap-1.5 px-5 py-3 overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === t.key
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:bg-white/[0.06] hover:text-slate-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-5" key={activeTab}>
        {tabContent[activeTab]}
      </div>
    </div>
  );
}
