/**
 * Mobile header — dark mode, sticky
 */
export default function Header({ currentUser }) {
  const initial = currentUser?.charAt(0)?.toUpperCase() || 'U';
  return (
    <header className="bg-[#0d0e14] border-b border-white/[0.06] px-5 py-3 flex justify-between items-center sticky top-0 z-40">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
          Y
        </div>
        <div>
          <div className="text-base font-bold text-white tracking-tight leading-tight">YPOTI</div>
          <div className="text-[10px] text-slate-500 font-medium">Compras</div>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs font-semibold text-emerald-400">
        {initial}
      </div>
    </header>
  );
}
