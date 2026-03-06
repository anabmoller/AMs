/**
 * KPI card for Hacienda module — label+icon header, large value, optional subtitle.
 * Uses SIGAM dark surface tokens.
 */
export default function HaciendaKpiCard({ label, value, sub, icon, color, loading }) {
  return (
    <div className="bg-[#F8F9FB]/[0.03] border border-white/[0.06] rounded-xl p-4 flex-1 min-w-[140px]">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg" style={{ color }}>{icon}</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color: color || "#fff" }}>
        {loading ? (
          <span className="inline-block w-12 h-6 bg-white/[0.04] rounded animate-pulse" />
        ) : value}
      </div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}
